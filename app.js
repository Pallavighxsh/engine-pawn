document.addEventListener("DOMContentLoaded", () => {

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

////////////////////////////////////////////////////
// 🆕 MOVE VALIDATION HELPERS
////////////////////////////////////////////////////

function getRow(i){ return Math.floor(i/8); }
function getCol(i){ return i%8; }

function pathClear(from,to){
  const fr=getRow(from), fc=getCol(from);
  const tr=getRow(to), tc=getCol(to);

  const dr=Math.sign(tr-fr);
  const dc=Math.sign(tc-fc);

  let r=fr+dr;
  let c=fc+dc;

  while(r!==tr || c!==tc){
    if(startPos[r*8+c] !== "") return false;
    r+=dr;
    c+=dc;
  }
  return true;
}

function isLegalMove(from,to,piece){

  const fr=getRow(from), fc=getCol(from);
  const tr=getRow(to), tc=getCol(to);

  const dr = tr-fr;
  const dc = tc-fc;

  const target = startPos[to];
  const white = isWhitePiece(piece);

  // cannot capture own
  if(target !== ""){
    if(isWhitePiece(target) === white) return false;
  }

  switch(piece){

    // white pawn
    case "♙":
      if(dc===0 && dr===-1 && target==="") return true;
      if(dc===0 && dr===-2 && fr===6 && target==="" && startPos[(fr-1)*8+fc]==="") return true;
      if(Math.abs(dc)===1 && dr===-1 && target!=="") return true;
      return false;

    // black pawn
    case "♟":
      if(dc===0 && dr===1 && target==="") return true;
      if(dc===0 && dr===2 && fr===1 && target==="" && startPos[(fr+1)*8+fc]==="") return true;
      if(Math.abs(dc)===1 && dr===1 && target!=="") return true;
      return false;

    // rook
    case "♖": case "♜":
      if(fr===tr || fc===tc) return pathClear(from,to);
      return false;

    // bishop
    case "♗": case "♝":
      if(Math.abs(dr)===Math.abs(dc)) return pathClear(from,to);
      return false;

    // queen
    case "♕": case "♛":
      if(fr===tr || fc===tc || Math.abs(dr)===Math.abs(dc))
        return pathClear(from,to);
      return false;

    // knight
    case "♘": case "♞":
      if((Math.abs(dr)===2 && Math.abs(dc)===1) || (Math.abs(dr)===1 && Math.abs(dc)===2))
        return true;
      return false;

    // king
    case "♔": case "♚":
      if(Math.abs(dr)<=1 && Math.abs(dc)<=1) return true;
      return false;
  }

  return false;
}

////////////////////////////////////////////////////

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

  if(!isLegalMove(from,to,piece)){
    bubble.innerHTML = "Illegal move.";
    return;
  }

  if(target!==""){
    const targetWhite = isWhitePiece(target);
    if(targetWhite === white){
      bubble.innerHTML = "Illegal move.";
      return;
    }

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

});
