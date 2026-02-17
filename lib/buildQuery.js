export function buildSearchQuery(fen){

  if(!fen){
    return "chess middlegame plans";
  }

  return `
You are a professional chess coach.
Analyze this chess position from the FEN below.

Give:
- who is better
- key plan
- one move suggestion

FEN:
${fen}

Keep answer under 80 words.
`;
}
