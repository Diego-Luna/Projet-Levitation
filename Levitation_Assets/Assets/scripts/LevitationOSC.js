#pragma strict

private var UDPHost : String = "127.0.0.1";
private var listenerPort : int = 8000;
private var broadcastPort : int = 57131;
private var oscHandler : Osc;

private var OpenBCIEvent : int = 0;
public var output_txt : GUIText;

private var Levitation:boolean = false;
private var startTimer:int;

private var LevitationTime : String = "00:00";
private var BestScore : String = "00:00";
	
// Torque for left/right rotation.
var rotateTorque = 1.0;
	
// Desired hovering height.
var hoverHeight = 10;
	
// The force applied per unit of distance below the desired height.
var hoverForce = 0;

// The amount that the lifting force is reduced per unit of upward speed.
// This damping tends to stop the object from bouncing after passing over
// something.
var hoverDamp = 0.5;

// Rigidbody component.
var rb: Rigidbody;

//Son lors de la levitation
var LevitationSound : AudioClip;

public function Start ()
{	
	var udp : UDPPacketIO = GetComponent("UDPPacketIO");
	udp.init(UDPHost, broadcastPort, listenerPort);
	oscHandler = GetComponent("Osc");
	oscHandler.init(udp);
			
	oscHandler.SetAddressHandler("/OpenBCITest", OpenBCITest);
		
	//Cube Levitation
	rb = GetComponent.<Rigidbody>();
	
	// Fairly high drag makes the object easier to control.
	rb.drag = 0.5;
	rb.angularDrag = 0.5;
	
}
Debug.Log("Running");

function Update () {
		
	if(Levitation == true){
		var time = Time.time - startTimer;
		
		var minutes : int = time / 60;
		var seconds : int = time % 60;
		//var milliseconds : int = time * 1000;
		
		LevitationTime = String.Format ("{0:00}:{1:00}", minutes, seconds);
		//LevitationTime = String.Format ("{0:00}:{1:00}", seconds, milliseconds);
		
		if(BestScore == "00:00"){
			BestScore = LevitationTime;
		} else {
			if(String.Compare(BestScore, LevitationTime) == -1){
				BestScore = LevitationTime;
			}
		}
	}
	
	output_txt.text = "Levitation Time: " + LevitationTime + "\n" + "Best Score: " + BestScore;

	var hit: RaycastHit;
	var downRay = new Ray(transform.position, -Vector3.up);
		
	// Cast a ray straight downwards.
	if (Physics.Raycast(downRay, hit)) {
		// The "error" in height is the difference between the desired height
		// and the height measured by the raycast distance.
		var hoverError = hoverHeight - hit.distance;
			
		// Only apply a lifting force if the object is too low (ie, let
		// gravity pull it downward if it is too high).
		if (hoverError > 0) {
			// Subtract the damping from the lifting force and apply it to
			// the rigidbody. 
			var upwardSpeed = rb.velocity.y;
			var lift = hoverError * hoverForce - upwardSpeed * hoverDamp;
			rb.AddForce(lift * Vector3.up);
		}
	}
	
	if( OpenBCIEvent == 1 || Input.GetKey("b")){
		hoverForce = 200;
		rb.AddTorque(rotateTorque * Vector3.up);
		rb.AddTorque(rotateTorque * Vector3.left);
	} else {
		hoverForce = 0;
	}
	
	//AUDIO
	GetComponent.<AudioSource>().pitch = rb.velocity.y/10;
}	

public function OpenBCITest(oscMessage : OscMessage) : void
{	
	Osc.OscMessageToString(oscMessage);
	OpenBCIEvent = oscMessage.Values[0];
} 

function OnCollisionEnter (col : Collision) {
	Levitation = false;
}

function OnCollisionExit (col : Collision) {
	startTimer = Time.time;
	Levitation = true;
}