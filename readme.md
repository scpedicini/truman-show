# Truman Show


## About

Truman Show is a quick image search program designed to be hotkeyed via AUTOHOTKEY to search the google image repository and copy selected images to the clipboard in an easy and accessible manner. The intent is to be as seamless as possible so that the user is not taken out of their normal workflow.

![alt text](assets/demo.gif)

## Features

✅ Search Google Images

✅ Copy images to clipboard

✅ Option to limit search to images before 2022 (useful for filtering AI generated images)

✅ Ban list for sites you don't want to see in your search results (e.g. stock image sites with watermarks)

## Getting Started

For newcomers, it is recommended that you download the latest release version and then skip to the "Register" section. However, if you would like to build the project yourself you can follow the instructions below.

### Run the following commands in order:   
1. `git clone https://github.com/scpedicini/truman-show`
2. `npm install`
3. `npm run dist`



### Register a custom image search engine with Google 

Truman show requires two API keys, a client id registered to your [Google custom search engine](https://cse.google.com/cse/all), and the secret API key associated with it. Truman Show attempts to retrieve these values from the environment variables *CSE_ID* and *CSE_KEY* respectively, but can be overridden in the settings page after launching the application. It is also recommended that you install a copy of [Autohotkey](https://www.autohotkey.com) for Windows, or [Raycast](https://www.raycast.com) for Mac in order to register a global shortcut to easily bring up Truman Show whenever you want to search for images.

Add the following to your autohotkey script (AHK) file:
```batch
^!H::
	Run, "c:/apps/.../dist/truman-show.exe"
return
```

You can now instantly access truman show whenever you type Ctrl-Alt-H.

### Future Plans

- [X] Add site(s) to ban list to prevent from showing up in the search (very useful to filter out stock image sites like shutterstock where images typically have watermarks) 


## Legal

Copyright (c) 2020 Specular Realms LLC  
https://specularrealms.com