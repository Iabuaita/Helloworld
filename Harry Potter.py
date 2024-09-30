import sys #system stuff for exiting
import time

Player = {
    "name": "chosen name"
}

myCharms = ["Protego", "Avada Kedvara", "Lumos", "Accio", "Alohomora", "Expulso"]
#// ---------------------

def gameOver ():
    print ("The dementor has found you!")
    print ("YOU'RE DEAD!")
    introStory ()
    
def endGame ():
    print ("YOU ARE DEAD!")

def illuminate ():
    print ("Available Charms" + "," .join(myCharms))
    selectedCharm = input("Select the charm >").lower ()
    if (selectedCharm == myCharms[2]):
        print ("The wand lights up")
    else:
        print ("Try again.")
        illuminate ()

def wizardAttack ():
    print ("Available Charms" + "," .join(myCharms))
    selectedspell = input("select the spell >") .lower ()
    if (selectedspell == myCharms [0]):
        print ("A big protection halo forms, YOU DEAFETED THE DARK WIZARDS")
    elif (selectedspell == myCharms [1]):
         print ("You kill everyone, YOU KILL HERMOINE TOO")
    elif (selectedspell == myCharms [5]):
        print ("You cause an explosion")
        endGame ()
    else:
        print ("Some appears from behind")
        endGame ()




def unlock ():
    print ("Available Charms" + "," .join(myCharms))
    selectedCharm = input("Select the charm >").lower()
    if (selectedCharm == myCharms[4]):
        print ("The door unlocks")
    else:
        print ("Try again.")
        unlock ()


def enterDoor ():
    decision = input("do you want to enter? Yes or no >").lower()
    if (decision == "yes"):
        print ("You enter the door")
    else:
        gameOver ()


def listenHermoine ():
    print ("Heromine ASKS YOU NOT")
    decide = input ("Attack or Listen? >") .lower ()
    if (decide == "Attack"):
        gameOver ()
    else:
        print ("A dark wizard LAUGHS")











def introStory():
    Player["name"] = input("Please enter your name > ")
    print("You're finally here," + " " + Player["name"])
    time.sleep(3)
    
    print("-----------------------------")
    print("Welcome to the Wizarding World," + " " + Player["name"] + "!")
    time.sleep(5)
    
    print("-----------------------------")
    print("You hear someone shouting in the dark")
    time.sleep(5)
    
    print("-----------------------------")
    print(Player["name"] + "," + " Where are you?")
    time.sleep(5)
    
    print("-----------------------------")
    print("It's dark," + " You don't see anything")
    illuminate ()
    print ("You see a door.")
    time.sleep (5)
    print (Player ["name"] +","+ "I am in here")
    time.sleep (3)
    print("The voice is coming from inside the door")
    unlock ()
    print("You open the door")
    enterDoor ()
    print ("You see Hermoine surrounded by dark wizards")
    time.sleep (3)
    print("You prepare to attack")
    time.sleep (3)
    listenHermoine ()
    print ("The dark wizards start attacking")
    wizardAttack ()





# Call the function to run the intro
introStory()

















