# DNSThought visualizations

This project has been created for NLnet Labs and consist of interactive visualizations showing DNSThought data. 

## Features
* Load and display data for the different SDGs

__Link for the visualization__ (to be updated)
[https://dnsthought.nlnetlabs.nl/vis/](https://dnsthought.nlnetlabs.nl/vis)

## Global CSS for UI
__Link for stylesheets__
* https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css (see https://getbootstrap.com/)

## Built with
* __Svelte__: Used as MVC framework.
* __Vite__: Used to build your code.
* __Various D3 Libraries__: Used for visualizations, adding interaction and reading the csv data files.
* __Sveltestrap__: Bootstrap for svelte, css grid used for responsiveness, js.

## Installation

This project uses `npm`. For installation you will need to install `node` and `npm`, if you don't already have it. `node` and `npm` can be installed from [here](https://nodejs.org/en/download/).

To install the project, simply clone the the repo and them run `npm install` in the project folder. You can use terminal on Mac and Command Prompt on Windows.

Run the terminal or command prompt and then run the following

```
git clone https://github.com/RoxanaTorre/DNSThoughtVisWeb
cd DNSThoughtVisWeb
npm install
```
## Local Development
To start the project locally, you can run `npm run dev` in the project folder in terminal or command prompt.

```bash
npm run dev
```

This will run the app in development mode. Open [http://localhost:5173/](http://localhost:5173/) to view it in the browser.

The page will reload if you make edits. You will also see any errors in the console.

To build the compiler and all the other modules included in the package:

```bash
npm run build
```
## Local data
There's a small dataset available at public/data which is used for testing locally during development. These files can be removed after compiling from the directory dist/data. 

Note that the following files should not be removed from the mentioned directory:

- labelsAll.csv
- shortAndLongLabels.csv
- asn.csv

## Author
Design and development: [**Roxana Torre**](mailto:roxana@torre.nl)