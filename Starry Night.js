let c1;
let c2;
let maxStar= 50; 

function setup() {
  createCanvas(600, 600);
  //gradient colors
  c1= color("rgb(19,19,19)")
  c2= color("#15085C")
  setGradient(c1, c2);
  
  //start
  textSize (21);
  frameRate (1);
}


function draw() {
  
// star
for (i = 0; i < 10; i++){
  x = random (width);
  y = random (height)
  text ("✨", x, y);
}

  if (i > maxStar){
    noLoop();
  }
    

}

function setGradient(c1, c2) {
  // noprotect
  noFill();
  for (y = 0; y < height; y++) {
    var inter = map(y, 0, height, 0, 1);
    var c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }
}