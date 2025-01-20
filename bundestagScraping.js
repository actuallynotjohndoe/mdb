// ==UserScript==
// @name        Bundestag, Social-Media-Scraper
// @match       https://www.bundestag.de/abgeordnete
// @grant       none
// @version     1.0
// @author      actuallynotjohndoe
// @license		GPLv3 or later: https://www.gnu.org/licenses/gpl-3.0.html.en
// @description 9/24/2024, 00:38:00 AM
// ==/UserScript==
//Das Script lädt asynchron alle Benutzerprofile der Abgeordneten nach und extrahiert gewünschte Informationen von dort (social media profile, biographie, beruf), um die Daten anschließend als CSV auszugeben (Trennzeichen ;).


//daten laden: name, fraktion und link zum profil
//alle weiteren daten müssen vom profil asynchron gescraped werden, dafür die darauffolgenden funktionen
function getAbgeordnete() {
  document.getElementsByClassName("bt-link-list")[0].click();
  const politikerListe = document.getElementsByClassName("bt-list-holder")[0];
  var abgeordnete = [];
  //var csv = "";


  for (var i = 0; i < politikerListe.childElementCount; i++) {
    let politiker = [];

    politiker["name"] = politikerListe.getElementsByTagName('a')[i].title;
    politiker["fraktion"] = politikerListe.getElementsByTagName('a')[i].getElementsByTagName('p')[0].textContent.trim();
    politiker["link"] = politikerListe.getElementsByTagName('a')[i].href;

	//ausgeschiedene politiker werden auf der bundestags-seite mit * markiert
    if (!politiker.fraktion.includes("*")) {
    	abgeordnete.push(politiker);
    }

    //csv += politiker["name"] + "; " + politiker["fraktion"] + "; " + politiker["link"] + "\n";

  }

  return abgeordnete;
}

//social media profile pro abgeordnete(n) nachladen
function getSocials(abgeordnete) {

  fetch(abgeordnete["link"]).then(function(response) {
    // MdB-Subseite erfolgreich geladen
    return response.text();
  }).then(function(html) {

    // HTML-Text-response → DOMElement
    let parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');    
    
    const socials = doc.getElementsByClassName("bt-linkliste")[0].children;
    abgeordnete["beruf"] = doc.getElementsByClassName("bt-biografie-beruf")[0].innerText.trim();
    abgeordnete["biographie"] = doc.getElementById("ptv1").innerText.trim();

    let landesliste = doc.getElementById("bt-landesliste-collapse");   
    abgeordnete["bundesland"] = landesliste.getElementsByTagName("h5")[0].textContent.trim();
    
    if (landesliste.getElementsByClassName("bt-linkliste")[0] != null) {
      let wk = landesliste.getElementsByClassName("bt-linkliste")[0].textContent.trim().replace("Wahlkreis ","").split(": ");
      abgeordnete["wknr"] = parseInt(wk[0]);
    	abgeordnete["wkname"] = wk[1];
    }

    for (var i = 0; i < socials.length; i++) {
      abgeordnete[socials[i].firstChild.title.toLowerCase().toString()] = socials[i].firstChild.href;
    }

    return true;

  }).catch(function(err) {
    // zomfg, seiten konnte nicht geladen werden
    console.warn(abgeordnete["link"] + ' Konnte nicht aufgerufen werden. ', err);
    return false;
  });

}

function generateCsv(abgeordnete) {
  let csv = "name;fraktion;link;bundesland;wknr;wkname;beruf;biographie;instagram;facebook;homepage;tiktok;youtube;x;\n";
  
  
  for (let i = 0; i < abgeordnete.length; i++) {
      csv += abgeordnete[i].name + ";"
      csv += abgeordnete[i].fraktion + ";"
      csv += abgeordnete[i].link + ";"
      csv += "\"" + abgeordnete[i].bundesland + "\";"
			
    	csv += ((typeof abgeordnete[i].wknr !== "undefined") ? abgeordnete[i].wknr : "") + ";"
    	csv += ((typeof abgeordnete[i].wkname !== "undefined") ? "\"" + abgeordnete[i].wkname + "\"" : "") + ";"
    
      //csv += abgeordnete[i].wknr + ";"
      //csv += "\"" + abgeordnete[i].wkname + "\";"
      csv += "\"" + abgeordnete[i].beruf + "\";"
      csv += "\"" + abgeordnete[i].biographie + "\";"

      csv += ((typeof abgeordnete[i].instagram !== "undefined") ? abgeordnete[i].instagram : "") + ";"
      csv += ((typeof abgeordnete[i].facebook !== "undefined") ? abgeordnete[i].facebook : "") + ";"
      csv += ((typeof abgeordnete[i].homepage !== "undefined") ? abgeordnete[i].homepage : "") + ";"
      csv += ((typeof abgeordnete[i].tiktok !== "undefined") ? abgeordnete[i].tiktok : "") + ";"
      csv += ((typeof abgeordnete[i].youtube !== "undefined") ? abgeordnete[i].youtube : "") + ";"
      csv += ((typeof abgeordnete[i].x !== "undefined") ? abgeordnete[i].x : "") + ";\n"
  }
  console.log(csv);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//ohne async delay würde der ganze bums nicht funktionieren (believe me, ich habs ausprobiert)
async function run() {

 var abgeordnete = getAbgeordnete();
 for (let i =0; i < abgeordnete.length; i++) {
    console.log(abgeordnete[i].link);
    getSocials(abgeordnete[i]);
    //RateLimit umgehen
    await delay(400);
  }

  generateCsv(abgeordnete);
  
  return abgeordnete;
}

run();
