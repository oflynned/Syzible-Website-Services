let chai = require('chai'), expect = chai.expect;
const collections = require("../../../../../config/collections");
const config = require('../../../../../config/db');
const db = require('monk')(config.mongoUrl);

const nounModel = require("../../../../../routes/tearma/v2/models/noun");

describe("noun model", () => {
    beforeEach((done) => {
        dropDb().then(() => done());
    });

    function dropDb() {
        return db.get(collections.getEnvironment()).drop();
    }

    describe("#create", () => {
        it('should follow noun schema successfully', () => {
            let fixture = {
                ga: {
                    term: "term",
                    mutations: {
                        nominativeSingular: "ns",
                        genitiveSingular: "gs",
                        nominativePlural: "np",
                        genitivePlural: "gp"
                    },
                    gender: "masculine",
                    declension: 1
                },
                en: {
                    term: "term"
                },
                domain: [
                    {
                        ga: "ga",
                        en: "en"
                    }
                ],
                examples: [
                    {
                        ga: "ga",
                        en: "en"
                    }
                ]
            };

            return nounModel.create(fixture)
                .then((data) => {
                    expect(data).to.be.an('object');
                    expect(data).to.contain.property("_id");

                    expect(data).to.contain.property("ga");
                    expect(data.ga).to.be.an("object");
                    expect(data.ga).to.have.property("term");
                    expect(data.ga).to.have.property("mutations");
                    expect(data.ga.mutations).to.be.an("object");
                    expect(data.ga.mutations).to.have.property("nominativeSingular");
                    expect(data.ga.mutations.nominativeSingular).to.equal("ns");
                    expect(data.ga.mutations).to.have.property("genitiveSingular");
                    expect(data.ga.mutations.genitiveSingular).to.equal("gs");
                    expect(data.ga.mutations).to.have.property("nominativePlural");
                    expect(data.ga.mutations.nominativePlural).to.equal("np");
                    expect(data.ga.mutations).to.have.property("genitivePlural");
                    expect(data.ga.mutations.genitivePlural).to.equal("gp");

                    expect(data.ga).to.have.property("gender");
                    expect(data.ga.gender).to.equal("masculine");
                    expect(data.ga).to.have.property("declension");
                    expect(data.ga.declension).to.equal(1);

                    expect(data).to.have.property("en");
                    expect(data.en).to.be.an("object");
                    expect(data.en).to.have.property("term");
                    expect(data.en.term).to.equal("term");

                    expect(data).to.have.property("domain");
                    expect(data.domain).to.be.an("array");
                    expect(data.domain[0]).to.have.property("en");
                    expect(data.domain[0].en).to.equal("en");
                    expect(data.domain[0]).to.have.property("ga");
                    expect(data.domain[0].ga).to.equal("ga");

                    expect(data).to.have.property("examples");
                    expect(data.examples).to.be.an("array");
                    expect(data.examples[0]).to.have.property("en");
                    expect(data.examples[0].en).to.equal("en");
                    expect(data.examples[0]).to.have.property("ga");
                    expect(data.examples[0].ga).to.equal("ga");
                })
        });
    });
});