import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URL;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class PokemonLoader {
	public static void main(String args[]) throws IOException, SQLException, ClassNotFoundException {
		Connection c = null;
		Class.forName("org.postgresql.Driver");
		c = DriverManager
				.getConnection("jdbc:postgresql://ec2-54-83-59-203.compute-1.amazonaws.com:5432/dab3gubtq4co9o?ssl=true&sslfactory=org.postgresql.ssl.NonValidatingFactory",
						"bsooqzlgrnlzpw", "_OeBjMpdVS7A-u6vDmBNpDhgEl");
		
		List<String> types = new ArrayList<String>();
		for(int i = 1;  i <= 718; i++){
			URL pokeURL = new URL("http://www.serebii.net/pokedex-xy/" + String.format("%03d", i) + ".shtml" );
			BufferedReader in = new BufferedReader(
					new InputStreamReader(pokeURL.openStream()));

			String inputLine;
			String name = null;
			types.clear();
			String description = null;
			boolean getTypes = false;
			
			int descriptionInNextLineCount = 0;
			
			boolean descriptionInNextLine = false;

			while ((inputLine = in.readLine()) != null){
				//Name attribute
				if(inputLine.contains("<title>")){
					name = inputLine.replace("<title>", "");
					name = name.substring(0, name.indexOf(" -"));
					System.out.println(i + "# " + name);
				}

				//Type attribute
				else if(!getTypes && (inputLine.contains("<td class=\"cen\"><a href=") || inputLine.contains("<td width=\"50%\">"))){
					boolean firstLine = true; 
					String[] splitType = inputLine.split("href");
					for(String preType : splitType){
						if(firstLine){
							firstLine = false;
							continue;
						}
						types.add(preType.substring(preType.indexOf("pokedex-xy/")+ 11,preType.indexOf(".shtml") ));
					}
					getTypes = true;
			
				}
				else if(inputLine.contains("foox")){
					descriptionInNextLineCount++;
					if(descriptionInNextLineCount == 2){
						descriptionInNextLine = true;
						descriptionInNextLineCount = -10000;
					}
				}

				//Description attribute
				else if(descriptionInNextLine){
					description = inputLine.replace("</td>", "");
					description = description.replace("\t", "");
					description = description.replace("<td class=\"fooinfo\">", "");
					descriptionInNextLine = false;
				}



			}
			if(types.size() == 1)
				types.add(null);

			String stm = "INSERT INTO poke_dex(id, name, description, type1, type2) VALUES(?, ?, ? , ? ,?)";
			PreparedStatement pst = c.prepareStatement(stm);
			pst.setInt(1, i);
			pst.setString(2, name);    
			pst.setString(3, description);   
			for(int k = 0; k < 2; k++){
				pst.setString(4 + k, types.get(k));
			}
			pst.executeUpdate();
			pst.close();
		}
	}
}
