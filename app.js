const board = document.getElementById("board");
const bubble = document.getElementById("analysisBubble");
const toggle = document.getElementById("colorToggle");
const analyzeBtn = document.getElementById("analyzeBtn");

let selected = null;
let blackMode = false;
let moves = [];

// 🆕 captured pieces
let capturedWhite = [];
let capturedBlack = [];

const startPos = [
"♜","♞","♝","♛","♚","♝","♞","♜",
"♟","♟","♟","♟","♟","♟","♟","♟",
"","","","","","","","",
"","","","","","","","",
"","","","","","","","",
"","","","","","","","",
"♙","♙","♙","♙","♙","♙","♙","♙",
"♖","♘","♗","♕","♔","♗","♘","♖"
];

function isWhitePiece(p){
  return "♙♖♘♗♕♔".includes(p);
}

function drawBoard(){
  board.innerHTML="";

  for(let i=0;i<64;i++){
    const sq=document.createElement("div");
    sq.classList.add("square");

    const row=Math.floor(i/8);
    const col=i%8;
    const dark=(row+col)%2;

    sq.classList.add(dark?"dark":"light");

    if(blackMode) sq.classList.add("black");

    const piece=startPos[i];
    sq.textContent=piece;

    if(piece!==""){
      const white=isWhitePiece(piece);

      if(!blackMode){
        sq.style.color = white ? "#ffffff" : "#000000";
      }else{
        sq.style.color = white ? "#ff4da6" : "#4da6ff";
      }
    }

    sq.addEventListener("click",()=>handleClick(i));
    board.appendChild(sq);
  }
}

function handleClick(i){
  if(selected===null){
    if(startPos[i]==="") return;
    selected=i;
    drawBoard();
    board.children[i].style.outline="3px solid hotpink";
    return;
  }

  movePiece(selected,i);
  selected=null;
  drawBoard();
}

function movePiece(from,to){

  const piece = startPos[from];
  const target = startPos[to];

  if(piece==="") return;

  const white = isWhitePiece(piece);

  // ❌ prevent capturing own piece
  if(target!==""){
    const targetWhite = isWhitePiece(target);
    if(targetWhite === white){
      bubble.innerHTML = "Illegal move.";
      return;
    }

    // 🆕 record capture
    if(targetWhite){
      capturedWhite.push(target);
    }else{
      capturedBlack.push(target);
    }
  }

  moves.push(`${from}-${to}`);
  startPos[to]=startPos[from];
  startPos[from]="";

  bubble.innerHTML="Move played.";
  drawCaptured();
}

toggle.onclick=()=>{
  blackMode=!blackMode;
  drawBoard();
};

////////////////////////////////////////////////////
// 🆕 CAPTURED PIECES DISPLAY
////////////////////////////////////////////////////

function drawCaptured(){
  let side = document.getElementById("captured");

  if(!side){
    side = document.createElement("div");
    side.id = "captured";
    side.style.display = "flex";
    side.style.flexDirection = "column";
    side.style.marginLeft = "16px";
    side.style.fontSize = "20px";
    board.parentNode.appendChild(side);
  }

  side.innerHTML = `
    <div><b>White captured:</b> ${capturedWhite.join(" ")}</div>
    <div style="margin-top:8px"><b>Black captured:</b> ${capturedBlack.join(" ")}</div>
  `;
}

////////////////////////////////////////////////////
// ♟️ FEN GENERATION
////////////////////////////////////////////////////

function pieceToFen(p){
  const map = {
    "♜":"r","♞":"n","♝":"b","♛":"q","♚":"k","♟":"p",
    "♖":"R","♘":"N","♗":"B","♕":"Q","♔":"K","♙":"P"
  };
  return map[p] || "";
}

function generateFEN(){

  let fen = "";
  let empty = 0;

  for(let i=0;i<64;i++){

    const piece = startPos[i];

    if(piece===""){
      empty++;
    }else{
      if(empty){
        fen += empty;
        empty = 0;
      }
      fen += pieceToFen(piece);
    }

    if((i+1)%8===0){
      if(empty){
        fen += empty;
        empty = 0;
      }
      if(i!==63) fen += "/";
    }
  }

  fen += " w - - 0 1";
  return fen;
}

////////////////////////////////////////////////////
// 🧠 ANALYZE BUTTON
////////////////////////////////////////////////////

analyzeBtn.onclick = async () => {

  const fen = generateFEN();
  console.log("FEN:", fen);

  bubble.innerHTML = "Analyzing position…";

  try{

    const res = await fetch("/api/analyze",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ fen })
    });

    const data = await res.json();
    bubble.innerHTML = data.text;

  }catch(e){
    bubble.innerHTML = "Analysis unavailable.";
  }
};

drawBoard();
drawCaptured();
