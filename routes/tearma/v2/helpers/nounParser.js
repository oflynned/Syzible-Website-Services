const fs = require("fs");
const elementTree = require("elementtree");
const xmldom = require("xmldom");
const xpath = require("xpath");
const parser = new xmldom.DOMParser();

const { create } = require("../models/noun");

const nounsQuery = "//termEntry[./langSet/tig/termNote[@type=\"partOfSpeech\" and text()=\"s\"]]";

function classifyGender (gender) {
  switch (gender.toString().toLowerCase()) {
    case "fir":
      return "masculine";
    case "bain":
      return "feminine";
    default:
      return "verbal noun";
  }
}

function classifyDeclension (declension) {
  return (declension.length > 0) ? parseInt(declension) : -1;
}

function parseQuotation (domain) {
  return domain.split("›")[0].trim();
}

function parseCommaSeparation (domain) {
  return domain.split(",").map(d => d.trim());
}

function uniq (array) {
  return array.reduce((a, b) => {
    if (a.indexOf(b) < 0) a.push(b);
    return a;
  }, []);
}

function classifyDomains (domains) {
  let classifiedDomains = domains.map(e => parseQuotation(e));
  classifiedDomains = classifiedDomains.map(e => parseCommaSeparation(e));
  classifiedDomains = [].concat.apply([], classifiedDomains);
  return uniq(classifiedDomains);
}

function groomNounFromDefinition (noun) {
  let maxCountEn = parseInt(xpath.select("count(//langSet[@lang=\"en\"]/tig)", noun));
  let maxCountGa = parseInt(xpath.select("count(//langSet[@lang=\"ga\"]/tig)", noun));
  let enDomains = xpath.select("//descrip[@type=\"domain\" and @lang=\"en\"]/text()", noun).map(d => d.data);
  let gaDomains = xpath.select("//descrip[@type=\"domain\" and @lang=\"ga\"]/text()", noun).map(d => d.data);

  let definitions = [];
  let enIterable = 0;
  let gaIterable = 0;

  for (let i = 1; i <= Math.max(maxCountGa, maxCountEn); i++) {
    if (maxCountEn === maxCountGa) {
      enIterable = gaIterable = i;
    } else if (maxCountEn > maxCountGa) {
      enIterable = i;
      gaIterable = 1;
    } else if (maxCountGa > maxCountEn) {
      enIterable = 1;
      gaIterable = i;
    }

    let enNominativeSingular = xpath.select(`//termEntry/langSet[@lang="en"]/tig/term[${enIterable}]/text()`, noun).toString();

    let rawGenderDeclension = xpath.select(`//termEntry/langSet[2]/tig/termNote[@type="partOfSpeech"][${gaIterable}]/text()`, noun).toString();
    let declension = rawGenderDeclension.replace(/\D/g, "");
    let gender = rawGenderDeclension.replace(/[0-9]/g, "");

    let gaNominativeSingular = xpath.select(`//termEntry/langSet[@lang="ga"]/tig/term[${gaIterable}]/text()`, noun).toString();
    let gaGenitiveSingular = xpath.select(`//termEntry/langSet[@lang="ga"]/tig/termNote[@type="gu"][${gaIterable}]/text()`, noun).toString();
    let gaNominativePlural = xpath.select(`//termEntry/langSet[@lang="ga"]/tig/termNote[@type="ai" or @type="iol"][${gaIterable}]/text()`, noun).toString();
    let gaGenitivePlural = xpath.select(`//termEntry/langSet[@lang="ga"]/tig/termNote[@type="gi" or @type="iol"][${gaIterable}]/text()`, noun).toString();

    let item = {
      ga: {
        term: gaNominativeSingular,
        mutations: {
          // TODO not all nouns are singular, some are marked with `iol`
          // plural/iol only nouns should be assigned to their appropriate mutations
          // all fields are now nullable unless all are assigned null
          nominativeSingular: gaNominativeSingular,
          genitiveSingular: gaGenitiveSingular.length === 0 ? null : gaGenitiveSingular,
          nominativePlural: gaNominativePlural.length === 0 ? null : gaNominativePlural,
          genitivePlural: gaGenitivePlural.length === 0 ? null : gaGenitivePlural
        },
        gender: classifyGender(gender),
        declension: classifyDeclension(declension),
        domains: classifyDomains(gaDomains)
      },
      en: {
        term: enNominativeSingular,
        domains: classifyDomains(enDomains)
      }
    };

    definitions.push(item);
  }

  return definitions;
}

module.exports.parseNouns = (path) => {
  const shouldWriteNounsXml = false;

  return new Promise((resolve) => {
    let xml = fs.readFileSync(path, "utf8");
    const tree = elementTree.parse(xml.toString());
    const root = tree.getroot();

    let stream;
    if (shouldWriteNounsXml) {
      stream = fs.createWriteStream("nouns.xml", { "flags": "a" });
      stream.write("<nouns>\n");
    }

    root.iter("termEntry", (data) => {
      let root = elementTree.tostring(data, { encoding: "utf8", method: "xml" });
      let noun = parser.parseFromString(root, "text/xml");
      let termEntry = xpath.select(nounsQuery, noun).toString();

      if (termEntry) {
        if (shouldWriteNounsXml) stream.write(termEntry + "\n");
        let nounSet = groomNounFromDefinition(noun);
        let nouns = [].concat(nounSet);
        let saveOperations = nouns.map((noun) => create(noun));
        Promise.all(saveOperations);
      }
    });

    if (shouldWriteNounsXml) {
      stream.write("</nouns>");
      stream.end();
    }

    resolve();
  });
};

module.exports.parseNounsFromData = (xml) => {
  return new Promise((resolve) => {
    let modifiedXml = xml.replace(/xml:lang/g, "lang");
    const tree = elementTree.parse(modifiedXml.toString());
    const root = tree.getroot();
    let nouns = [];

    root.iter("termEntry", (data) => {
      let root = elementTree.tostring(data, { encoding: "utf8", method: "xml" });
      let noun = parser.parseFromString(root, "text/xml");
      let termEntry = xpath.select(nounsQuery, noun).toString();
      if (termEntry) {
        let nounSet = groomNounFromDefinition(noun);
        nouns = nouns.concat(nounSet);
      }
    });

    let saveOperations = nouns.map((noun) => create(noun));
    Promise.all(saveOperations).then((values) => resolve(values));
  });
};
