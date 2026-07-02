import { TEAMS } from '../data';

export interface PlayerOption {
  name: string;
  team: string;
}

export const getPlayerFlag = (teamName: string): string => {
  const normalized = teamName.trim().toLowerCase();
  const team = Object.values(TEAMS).find(t => 
    t.name.toLowerCase() === normalized || 
    (normalized.includes('congo') && t.name.toLowerCase().includes('congo'))
  );
  return team ? team.flag : '🏳️';
};

export const getPlayerOptionLabel = (player: PlayerOption): string => {
  const flag = getPlayerFlag(player.team);
  return `${flag} ${player.name} (${player.team})`;
};

// Sorted alphabetically by player name
export const TOP_SCORERS: PlayerOption[] = [
  { name: 'Achraf Hakimi', team: 'Marruecos' },
  { name: 'Alexander Isak', team: 'Suecia' },
  { name: 'Amad Diallo', team: 'Costa de Marfil' },
  { name: 'Anthony Elanga', team: 'Suecia' },
  { name: 'Ayase Ueda', team: 'Japón' },
  { name: 'Bradley Barcola', team: 'Francia' },
  { name: 'Brian Brobbey', team: 'Países Bajos' },
  { name: 'Cody Gakpo', team: 'Países Bajos' },
  { name: 'Cristiano Ronaldo', team: 'Portugal' },
  { name: 'Crysencio Summerville', team: 'Países Bajos' },
  { name: 'Cyle Larin', team: 'Canadá' },
  { name: 'Daichi Kamada', team: 'Japón' },
  { name: 'Daniel Muñoz', team: 'Colombia' },
  { name: 'Deniz Undav', team: 'Alemania' },
  { name: 'Elijah Just', team: 'Nueva Zelanda' },
  { name: 'Erling Haaland', team: 'Noruega' },
  { name: 'Ermin Mahmic', team: 'Bosnia y Herzegovina' },
  { name: 'Folarin Balogun', team: 'Estados Unidos' },
  { name: 'Gonzalo Plata', team: 'Ecuador' },
  { name: 'Habib Diarra', team: 'Senegal' },
  { name: 'Harry Kane', team: 'Inglaterra' },
  { name: 'Ismael Saibari', team: 'Marruecos' },
  { name: 'Ismaïla Sarr', team: 'Senegal' },
  { name: 'Jan Paul van Hecke', team: 'Países Bajos' },
  { name: 'Johan Manzambi', team: 'Suiza' },
  { name: 'Jonathan David', team: 'Canadá' },
  { name: 'Jude Bellingham', team: 'Inglaterra' },
  { name: 'Julián Quiñones', team: 'México' },
  { name: 'Kai Havertz', team: 'Alemania' },
  { name: 'Kylian Mbappé', team: 'Francia' },
  { name: 'Leandro Trossard', team: 'Bélgica' },
  { name: 'Lionel Messi', team: 'Argentina' },
  { name: 'Marko Arnautovic', team: 'Austria' },
  { name: 'Matheus Cunha', team: 'Brasil' },
  { name: 'Maxi Araújo', team: 'Uruguay' },
  { name: 'Mikel Oyarzabal', team: 'España' },
  { name: 'Nicolas Pépé', team: 'Costa de Marfil' },
  { name: 'Ousmane Dembélé', team: 'Francia' },
  { name: 'Pape Gueye', team: 'Senegal' },
  { name: 'Ramin Rezaeian', team: 'Irán' },
  { name: 'Raúl Jiménez', team: 'México' },
  { name: 'Riyad Mahrez', team: 'Argelia' },
  { name: 'Romelu Lukaku', team: 'Bélgica' },
  { name: 'Rubén Vargas', team: 'Suiza' },
  { name: 'Virgil van Dijk', team: 'Países Bajos' },
  { name: 'Vinícius Júnior', team: 'Brasil' },
  { name: 'Viktor Gyökeres', team: 'Suecia' },
  { name: 'Yasin Ayari', team: 'Suecia' },
  { name: 'Yoane Wissa', team: 'R. D. Congo' },
  { name: 'Youri Tielemans', team: 'Bélgica' }
].sort((a, b) => a.name.localeCompare(b.name));

// Sorted alphabetically by player name
export const TOP_ASSISTERS: PlayerOption[] = [
  { name: 'Achraf Hakimi', team: 'Marruecos' },
  { name: 'Alex Freeman', team: 'Estados Unidos' },
  { name: 'Alexander Isak', team: 'Suecia' },
  { name: 'Anthony Gordon', team: 'Inglaterra' },
  { name: 'Arthur Masuaku', team: 'R. D. Congo' },
  { name: 'Ayase Ueda', team: 'Japón' },
  { name: 'Brahim Díaz', team: 'Marruecos' },
  { name: 'Breel Embolo', team: 'Suiza' },
  { name: 'Bruno Guimarães', team: 'Brasil' },
  { name: 'Bukayo Saka', team: 'Inglaterra' },
  { name: 'Chadi Riad', team: 'Marruecos' },
  { name: 'Chancel Mbemba', team: 'R. D. Congo' },
  { name: 'Chris Wood', team: 'Nueva Zelanda' },
  { name: 'Cody Gakpo', team: 'Países Bajos' },
  { name: 'Crysencio Summerville', team: 'Países Bajos' },
  { name: 'Deniz Undav', team: 'Alemania' },
  { name: 'Denzel Dumfries', team: 'Países Bajos' },
  { name: 'Elliot Anderson', team: 'Inglaterra' },
  { name: 'Felix Nmecha', team: 'Alemania' },
  { name: 'Florian Wirtz', team: 'Alemania' },
  { name: 'Gabriel Magalhães', team: 'Brasil' },
  { name: 'Hannibal Mejbri', team: 'Túnez' },
  { name: 'Houssem Aouar', team: 'Argelia' },
  { name: 'Ibrahim Sangaré', team: 'Costa de Marfil' },
  { name: 'Iliman Ndiaye', team: 'Senegal' },
  { name: 'Ismaïla Sarr', team: 'Senegal' },
  { name: 'Jude Bellingham', team: 'Inglaterra' },
  { name: 'Julián Quiñones', team: 'México' },
  { name: 'Julio Enciso', team: 'Paraguay' },
  { name: 'Keito Nakamura', team: 'Japón' },
  { name: 'Kylian Mbappé', team: 'Francia' },
  { name: 'Leandro Trossard', team: 'Bélgica' },
  { name: 'Martin Ødegaard', team: 'Noruega' },
  { name: 'Michael Olise', team: 'Francia' },
  { name: 'Mohamed Salah', team: 'Egipto' },
  { name: 'Moussa Niakhaté', team: 'Senegal' },
  { name: 'Nathan Saliba', team: 'Canadá' },
  { name: 'Ousmane Dembélé', team: 'Francia' },
  { name: 'Patrick Berg', team: 'Noruega' },
  { name: 'Pedro Vite', team: 'Ecuador' },
  { name: 'Ritsu Doan', team: 'Japón' },
  { name: 'Roberto Alvarado', team: 'México' },
  { name: 'Ryan Gravenberch', team: 'Países Bajos' },
  { name: 'Sadio Mané', team: 'Senegal' },
  { name: 'Sead Kolasinac', team: 'Bosnia y Herzegovina' },
  { name: 'Viktor Gyökeres', team: 'Suecia' },
  { name: 'Vinícius Júnior', team: 'Brasil' },
  { name: 'Virgil van Dijk', team: 'Países Bajos' },
  { name: 'Yan Diomande', team: 'Costa de Marfil' }
].sort((a, b) => a.name.localeCompare(b.name));
