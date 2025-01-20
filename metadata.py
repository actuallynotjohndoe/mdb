import csv
import pandas as pd
import gender_guesser.detector as gender
from dateparser.search import search_dates
from pandas import option_context
import numpy as np

d = gender.Detector(case_sensitive=False)

outputFile = './mdbWithMetadata.csv'
inputFile = './mdb.csv'
#funktion zur geschlechtsbestimmung anhand des vornamens. lange war es rechtlich verpflichtend, einen geschlechtlich eindeutigen namen zu tragen, daher akzepatbler proxy
def geschlecht(name):
    vorname = name.split(", ")
    if len(vorname) > 1:
        vorname = vorname[1].replace("Dr.", "")
        vorname = vorname.replace("Prof.", "")
        vorname = vorname.replace("jur.", "")
        vorname = vorname.replace("von", "")
        vorname = vorname.replace("Freiherr", "")
        vorname = vorname.replace("med.", "")
        vorname = vorname.replace("-Ing.", "")
        vorname = vorname.replace("habil.", "")
        vorname = vorname.strip()
        

        if len(vorname.split("-")) > 1:
            vorname = vorname.split("-")[0]
            
        if len(vorname.split(" ")) > 1:
            vorname = vorname.split(" ")[0]
        
        gender = d.get_gender(vorname)

    else:
        gender = d.get_gender(name)

    return gender
    

def geburtsdatum(biographie):
    datum = biographie.split("\n")[0]
    datum = search_dates(datum)
    return datum
    

def getInstaUsername(name): 
    #print(type(name))
    if (type(name)!=str or len(name)==0 or name=="http://"):
        return ""
        
    #clean data
    name = name.replace(".coom/", ".com/")
    name = name.replace(".de/", ".com/")
    name = name.replace("{", "/")
    
    username = name.strip().split(".com/")
    if len(username) >1:
        username = username[1].split("/")[0].split("?")[0]

    return username

def statistik():
    #westdeutscher wahlkreis?
    westen = "nordrhein|nieder|bremen|schlesw|hambu|baden|bayern|hessen|rheinland|saarland"
    abgeordnete["westen"] = abgeordnete["bundesland"].str.contains(westen, case=False, na=False)
    #print(abgeordnete[abgeordnete["westen"]==False])

    #variablen für statistikprogramme transformieren
    abgeordnete["has_instagram"] = np.where(abgeordnete["instagram"] != "", 1, 0)
    abgeordnete["has_x"] = np.where(~abgeordnete["x"].isnull(), 1, 0)
    abgeordnete["has_facebook"] = np.where(~abgeordnete["facebook"].isnull(), 1, 0)
    abgeordnete["has_homepage"] = np.where(~abgeordnete["homepage"].isnull(), 1, 0)
    #print(abgeordnete)
    return True


def stichprobe():
    arbeiter = abgeordnete[(abgeordnete["studium"] == False) & ((abgeordnete["fraktion"] == "SPD") | (abgeordnete["fraktion"] == "Bündnis 90/Die Grünen")) & abgeordnete["has_instagram"] == True]
    akademiker = abgeordnete[(abgeordnete["studium"] == True) & ((abgeordnete["fraktion"] == "SPD") | (abgeordnete["fraktion"] == "Bündnis 90/Die Grünen")) & abgeordnete["has_instagram"] == True]
    akademikerStichprobe = akademiker.sample(frac=0.12)
    stichprobe = akademikerStichprobe._append(arbeiter)

    print(stichprobe)

    stichprobe = stichprobe.dropna(how='all', axis='columns')
    stichprobe.to_csv('../stichprobe.csv', index=False, sep=";", quoting=csv.QUOTE_ALL)
    return True



#datei einlesen
abgeordnete = pd.read_csv(inputFile, sep=";", quoting=csv.QUOTE_ALL)
#print (abgeordnete.keys())
#print(abgeordnete.keys())


#akademiker/arbeiter bestimmen
studiumKeywords = "studium|bachelor|diplom|universität|fachhochschule|master|wissenschaft|staatsexamen|rechtsanw|b\.a\.|b\.sc\.|m\.a\.|m\.sc\.|dipl\.|med\.|jur\.|ing\.|lehramt|phil\."
abgeordnete["studium"] = abgeordnete['biographie'].str.contains(studiumKeywords, case=False, na=False) | abgeordnete['beruf'].str.contains(studiumKeywords, case=False, na=False)

#arbeiteranteil berechnen
arbeiteranteil = len(abgeordnete[abgeordnete["studium"]==False])/len(abgeordnete)*100
print("arbeiteranteil: ", arbeiteranteil)

#geschlecht für alle rows bestimmen
abgeordnete["gender"] = abgeordnete["name"].apply(geschlecht)
frauenanteil = len(abgeordnete[abgeordnete["gender"]=="female"] + abgeordnete[abgeordnete["gender"]=="mostly_female"])/len(abgeordnete)*100
print ("Frauenanteil: ", frauenanteil)

#insta username bestimmen
abgeordnete["instagram"] = abgeordnete["instagram"].apply(getInstaUsername)

statistik()


#abgeordnete["alter"] = abgeordnete["biographie"].apply(geburtsdatum)
#print(abgeordnete["alter"])

#drop unnamed index column and write dataframe to csv file
abgeordnete = abgeordnete.dropna(how='all', axis='columns')
abgeordnete.to_csv(outputFile, index=False, sep=";", quoting=csv.QUOTE_ALL)

#stichprobe()