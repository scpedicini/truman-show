# Truman Show


## Design

<br>
Truman Show is a quick image search program designed to be hotkeyed via AUTOHOTKEY to search the google image repository and copy to clipboard in a fast access manner.<br><br>


## Getting Started
<br>


### Run the following steps in order:

<br>

1. git clone https://github.com/scpedicini
2. npm install
3. npm run dist

<br>

### Register a custom image search engine with Google 
<br>
Truman show requires two API keys, a client id registered to your Google custom search engine, and the secret API key associated with it. These values are pulled directly from the environment variables *CSE_ID* and *CSE_KEY* respectively. It is also recommended that you install a copy of Autohotkey in order to register a global shortcut to easily bring up Truman Show whenever you want to search for images.


Add the following to your autohotkey script AHK file:
<pre>
^!H::
	Run, "c:/apps/.../dist/truman-show.exe"
return
</pre>

You can now instantly access truman show whenever you type Ctrl-Alt-H.

<br>

## Legal
<br>
Copyright (c) 2020 Specular Realms LLC

https://specularrealms.com