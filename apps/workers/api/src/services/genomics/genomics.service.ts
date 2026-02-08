/**
 * Genomics & Personalized Medicine Service
 * Module Génomique & Médecine Personnalisée
 * Analyse génétique et pharmacogénomique
 */

// Types
export interface GeneticTest {
  id: string;
  patientId: string;
  testType: GeneticTestType;
  panelName: string;
  genes: string[];
  orderingProvider: string;
  orderedAt: string;
  collectedAt?: string;
  receivedAt?: string;
  reportedAt?: string;
  status: 'ordered' | 'collected' | 'in_process' | 'completed' | 'cancelled';
  specimen: {
    type: 'blood' | 'saliva' | 'buccal_swab' | 'tissue';
    collectionMethod: string;
    tubeType?: string;
    quantity?: string;
  };
  laboratory: {
    name: string;
    clia?: string;
    accreditation?: string[];
  };
  results?: GeneticResult[];
  interpretation?: GeneticInterpretation;
  report?: {
    url: string;
    generatedAt: string;
  };
}

export type GeneticTestType =
  | 'pharmacogenomics'
  | 'hereditary_cancer'
  | 'cardiovascular'
  | 'rare_disease'
  | 'prenatal'
  | 'carrier_screening'
  | 'whole_exome'
  | 'whole_genome';

export interface GeneticResult {
  gene: string;
  variant: string;
  rsId?: string;
  hgvs?: {
    genomic: string;
    coding?: string;
    protein?: string;
  };
  zygosity: 'homozygous' | 'heterozygous' | 'hemizygous' | 'compound_heterozygous';
  classification: 'pathogenic' | 'likely_pathogenic' | 'vus' | 'likely_benign' | 'benign';
  alleleFrequency?: number;
  inheritance?: 'autosomal_dominant' | 'autosomal_recessive' | 'x_linked' | 'mitochondrial';
  clinicalSignificance?: string;
  associatedConditions?: string[];
  actionable: boolean;
}

export interface GeneticInterpretation {
  summary: string;
  riskAssessments: RiskAssessment[];
  recommendations: GeneticRecommendation[];
  pharmacogenomicGuidance?: PharmacogenomicGuidance[];
  familyImplications?: string;
  geneticCounseling: {
    recommended: boolean;
    reason?: string;
    urgency?: 'routine' | 'soon' | 'urgent';
  };
  limitations: string[];
  interpretedBy: string;
  interpretedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface RiskAssessment {
  condition: string;
  icdCode?: string;
  riskLevel: 'average' | 'moderate' | 'high' | 'very_high';
  lifetimeRisk?: number;
  relativeRisk?: number;
  confidenceInterval?: [number, number];
  comparedToPopulation: number;
  evidence: 'strong' | 'moderate' | 'limited';
  preventionStrategies: string[];
  screeningRecommendations: string[];
}

export interface GeneticRecommendation {
  type: 'screening' | 'prevention' | 'treatment' | 'cascade_testing' | 'lifestyle' | 'surveillance';
  priority: 'high' | 'medium' | 'low';
  description: string;
  rationale: string;
  timing?: string;
  frequency?: string;
  specialist?: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  guidelineSource?: string;
}

export interface PharmacogenomicGuidance {
  gene: string;
  phenotype: string;
  drugs: DrugGuidance[];
}

export interface DrugGuidance {
  drugName: string;
  drugClass: string;
  recommendation: 'use_as_directed' | 'alter_dose' | 'consider_alternative' | 'avoid';
  dosageGuidance?: string;
  alternativeDrugs?: string[];
  riskDescription?: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  source: 'CPIC' | 'DPWG' | 'FDA' | 'institution';
  sourceLink?: string;
}

export interface GenePanel {
  id: string;
  name: string;
  type: GeneticTestType;
  genes: string[];
  conditions: string[];
  turnaroundDays: number;
  cost: number;
  covered: boolean;
  methodology: ('sequencing' | 'deletion_duplication' | 'methylation')[];
  reflex?: string[];
  limitations: string[];
}

export interface FamilyHistory {
  patientId: string;
  relatives: FamilyMember[];
  pedigreeUrl?: string;
  riskScores: {
    model: string;
    condition: string;
    score: number;
    riskCategory: string;
    calculatedAt: string;
  }[];
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  relationship: string;
  sideOfFamily: 'maternal' | 'paternal' | 'both';
  gender: 'M' | 'F';
  ageAtDiagnosis?: number;
  currentAge?: number;
  deceased: boolean;
  ageAtDeath?: number;
  causeOfDeath?: string;
  conditions: {
    name: string;
    icdCode?: string;
    ageAtOnset?: number;
    confirmed: boolean;
  }[];
  geneticTesting?: {
    performed: boolean;
    results?: string;
  };
}

export interface CascadeTestingRecommendation {
  id: string;
  sourcePatientId: string;
  variant: string;
  gene: string;
  condition: string;
  relationship: string;
  relativeId?: string;
  relativeName?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'contacted' | 'tested' | 'declined' | 'not_applicable';
  contactedAt?: string;
  testedAt?: string;
  result?: 'positive' | 'negative' | 'vus';
  notes?: string;
}

// Mock data
const genePanels: GenePanel[] = [
  {
    id: 'panel-001',
    name: 'Panel Pharmacogénomique Complet',
    type: 'pharmacogenomics',
    genes: ['CYP2D6', 'CYP2C19', 'CYP2C9', 'CYP3A4', 'CYP3A5', 'SLCO1B1', 'VKORC1', 'DPYD', 'TPMT', 'UGT1A1', 'HLA-B'],
    conditions: ['Réponse médicamenteuse', 'Métabolisme des médicaments'],
    turnaroundDays: 14,
    cost: 450,
    covered: true,
    methodology: ['sequencing'],
    limitations: ['Ne détecte pas toutes les variantes rares']
  },
  {
    id: 'panel-002',
    name: 'Panel Cancer Héréditaire',
    type: 'hereditary_cancer',
    genes: ['BRCA1', 'BRCA2', 'TP53', 'PTEN', 'CDH1', 'STK11', 'PALB2', 'CHEK2', 'ATM', 'MLH1', 'MSH2', 'MSH6', 'PMS2', 'EPCAM', 'APC', 'MUTYH'],
    conditions: ['Cancer du sein', 'Cancer de l\'ovaire', 'Cancer colorectal', 'Syndrome de Lynch'],
    turnaroundDays: 21,
    cost: 1200,
    covered: true,
    methodology: ['sequencing', 'deletion_duplication'],
    limitations: ['Ne détecte pas les réarrangements complexes']
  },
  {
    id: 'panel-003',
    name: 'Panel Cardiovasculaire',
    type: 'cardiovascular',
    genes: ['LDLR', 'APOB', 'PCSK9', 'MYH7', 'MYBPC3', 'TNNT2', 'TNNI3', 'SCN5A', 'KCNQ1', 'KCNH2', 'RYR2', 'LMNA'],
    conditions: ['Hypercholestérolémie familiale', 'Cardiomyopathie', 'Syndrome du QT long', 'Syndrome de Brugada'],
    turnaroundDays: 21,
    cost: 950,
    covered: true,
    methodology: ['sequencing', 'deletion_duplication'],
    limitations: []
  }
];

const geneticTests: GeneticTest[] = [];

export class GenomicsService {

  // Get available gene panels
  getPanels(type?: GeneticTestType): GenePanel[] {
    if (type) {
      return genePanels.filter(p => p.type === type);
    }
    return genePanels;
  }

  // Get panel by ID
  getPanel(panelId: string): GenePanel | undefined {
    return genePanels.find(p => p.id === panelId);
  }

  // Order genetic test
  async orderTest(data: {
    patientId: string;
    panelId: string;
    orderingProvider: string;
    indication: string;
    specimenType: GeneticTest['specimen']['type'];
    priorityRush?: boolean;
    clinicalHistory?: string;
    familyHistory?: string;
  }): Promise<GeneticTest> {
    const panel = this.getPanel(data.panelId);
    if (!panel) throw new Error('Panel not found');

    const test: GeneticTest = {
      id: `gt-${Date.now()}`,
      patientId: data.patientId,
      testType: panel.type,
      panelName: panel.name,
      genes: panel.genes,
      orderingProvider: data.orderingProvider,
      orderedAt: new Date().toISOString(),
      status: 'ordered',
      specimen: {
        type: data.specimenType,
        collectionMethod: data.specimenType === 'blood' ? 'Venipuncture' : 'Kit collection'
      },
      laboratory: {
        name: 'Laboratoire de Génétique Moléculaire',
        clia: 'CLF99999999',
        accreditation: ['ISO 15189', 'CAP']
      }
    };

    geneticTests.push(test);
    return test;
  }

  // Get test by ID
  getTest(testId: string): GeneticTest | undefined {
    return geneticTests.find(t => t.id === testId);
  }

  // Get patient's genetic tests
  getPatientTests(patientId: string): GeneticTest[] {
    return geneticTests
      .filter(t => t.patientId === patientId)
      .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());
  }

  // Update test status
  async updateTestStatus(testId: string, status: GeneticTest['status'], data?: {
    collectedAt?: string;
    receivedAt?: string;
  }): Promise<GeneticTest> {
    const test = this.getTest(testId);
    if (!test) throw new Error('Test not found');

    test.status = status;
    if (data?.collectedAt) test.collectedAt = data.collectedAt;
    if (data?.receivedAt) test.receivedAt = data.receivedAt;

    return test;
  }

  // Add test results
  async addResults(testId: string, data: {
    results: GeneticResult[];
    interpretation: Omit<GeneticInterpretation, 'interpretedAt'>;
    reportUrl?: string;
  }): Promise<GeneticTest> {
    const test = this.getTest(testId);
    if (!test) throw new Error('Test not found');

    test.results = data.results;
    test.interpretation = {
      ...data.interpretation,
      interpretedAt: new Date().toISOString()
    };
    test.status = 'completed';
    test.reportedAt = new Date().toISOString();

    if (data.reportUrl) {
      test.report = {
        url: data.reportUrl,
        generatedAt: new Date().toISOString()
      };
    }

    // Check for cascade testing recommendations
    await this.generateCascadeRecommendations(test);

    return test;
  }

  // Get pharmacogenomic guidance for patient
  async getPharmacogenomicProfile(patientId: string): Promise<{
    hasResults: boolean;
    phenotypes: { gene: string; phenotype: string; implication: string }[];
    drugGuidance: DrugGuidance[];
    lastUpdated?: string;
  }> {
    const pgxTests = geneticTests.filter(
      t => t.patientId === patientId &&
           t.testType === 'pharmacogenomics' &&
           t.status === 'completed'
    );

    if (pgxTests.length === 0) {
      return {
        hasResults: false,
        phenotypes: [],
        drugGuidance: []
      };
    }

    const latestTest = pgxTests[0];
    const guidance = latestTest.interpretation?.pharmacogenomicGuidance || [];

    return {
      hasResults: true,
      phenotypes: guidance.map(g => ({
        gene: g.gene,
        phenotype: g.phenotype,
        implication: this.getPhenotypeImplication(g.phenotype)
      })),
      drugGuidance: guidance.flatMap(g => g.drugs),
      lastUpdated: latestTest.reportedAt
    };
  }

  // Check drug-gene interactions
  async checkDrugGeneInteraction(patientId: string, drugName: string): Promise<{
    hasInteraction: boolean;
    gene?: string;
    phenotype?: string;
    recommendation?: DrugGuidance['recommendation'];
    guidance?: string;
    alternatives?: string[];
    source?: string;
  }> {
    const profile = await this.getPharmacogenomicProfile(patientId);

    if (!profile.hasResults) {
      return { hasInteraction: false };
    }

    const drugGuidance = profile.drugGuidance.find(
      d => d.drugName.toLowerCase() === drugName.toLowerCase()
    );

    if (!drugGuidance) {
      return { hasInteraction: false };
    }

    const phenotype = profile.phenotypes.find(p =>
      drugGuidance.drugClass.includes(p.gene) || drugGuidance.drugName.includes(p.gene)
    );

    return {
      hasInteraction: drugGuidance.recommendation !== 'use_as_directed',
      gene: phenotype?.gene,
      phenotype: phenotype?.phenotype,
      recommendation: drugGuidance.recommendation,
      guidance: drugGuidance.dosageGuidance,
      alternatives: drugGuidance.alternativeDrugs,
      source: drugGuidance.source
    };
  }

  // Calculate hereditary cancer risk
  async calculateHereditaryRisk(patientId: string): Promise<{
    hasGeneticData: boolean;
    risks: RiskAssessment[];
    screeningSchedule: {
      procedure: string;
      frequency: string;
      startAge?: number;
      nextDue?: string;
    }[];
    preventiveOptions: string[];
  }> {
    const cancerTests = geneticTests.filter(
      t => t.patientId === patientId &&
           t.testType === 'hereditary_cancer' &&
           t.status === 'completed'
    );

    if (cancerTests.length === 0) {
      return {
        hasGeneticData: false,
        risks: [],
        screeningSchedule: [],
        preventiveOptions: []
      };
    }

    const latestTest = cancerTests[0];
    const pathogenicVariants = latestTest.results?.filter(
      r => r.classification === 'pathogenic' || r.classification === 'likely_pathogenic'
    ) || [];

    // Generate risk assessments based on variants
    const risks: RiskAssessment[] = [];
    const screeningSchedule: { procedure: string; frequency: string; startAge?: number; nextDue?: string }[] = [];
    const preventiveOptions: string[] = [];

    for (const variant of pathogenicVariants) {
      if (variant.gene === 'BRCA1' || variant.gene === 'BRCA2') {
        risks.push({
          condition: 'Cancer du sein',
          icdCode: 'C50',
          riskLevel: 'very_high',
          lifetimeRisk: variant.gene === 'BRCA1' ? 0.72 : 0.69,
          comparedToPopulation: 5.5,
          evidence: 'strong',
          preventionStrategies: ['Mastectomie prophylactique', 'Chimioprévention'],
          screeningRecommendations: ['IRM mammaire annuelle', 'Mammographie annuelle']
        });

        screeningSchedule.push(
          { procedure: 'IRM mammaire', frequency: 'Annuelle', startAge: 25 },
          { procedure: 'Mammographie', frequency: 'Annuelle', startAge: 30 }
        );

        preventiveOptions.push(
          'Mastectomie bilatérale prophylactique',
          'Salpingo-ovariectomie prophylactique',
          'Chimioprévention (tamoxifène)'
        );
      }

      if (['MLH1', 'MSH2', 'MSH6', 'PMS2'].includes(variant.gene)) {
        risks.push({
          condition: 'Cancer colorectal (Lynch)',
          icdCode: 'C18',
          riskLevel: 'very_high',
          lifetimeRisk: 0.52,
          comparedToPopulation: 8,
          evidence: 'strong',
          preventionStrategies: ['Colectomie prophylactique en cas de polypes'],
          screeningRecommendations: ['Coloscopie tous les 1-2 ans']
        });

        screeningSchedule.push(
          { procedure: 'Coloscopie', frequency: 'Tous les 1-2 ans', startAge: 20 }
        );
      }
    }

    return {
      hasGeneticData: true,
      risks,
      screeningSchedule,
      preventiveOptions
    };
  }

  // Generate cascade testing recommendations
  private async generateCascadeRecommendations(test: GeneticTest): Promise<CascadeTestingRecommendation[]> {
    const recommendations: CascadeTestingRecommendation[] = [];

    const pathogenicVariants = test.results?.filter(
      r => r.classification === 'pathogenic' || r.classification === 'likely_pathogenic'
    ) || [];

    for (const variant of pathogenicVariants) {
      if (variant.actionable) {
        // Recommend testing for first-degree relatives
        const relationships = ['Parent', 'Sibling', 'Child'];

        for (const relationship of relationships) {
          recommendations.push({
            id: `cascade-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            sourcePatientId: test.patientId,
            variant: variant.variant,
            gene: variant.gene,
            condition: variant.associatedConditions?.[0] || 'Condition héréditaire',
            relationship,
            priority: variant.classification === 'pathogenic' ? 'high' : 'medium',
            status: 'pending'
          });
        }
      }
    }

    return recommendations;
  }

  // Get cascade testing recommendations for a patient's family
  async getCascadeRecommendations(patientId: string): Promise<CascadeTestingRecommendation[]> {
    // In production, this would query a database
    return [];
  }

  // Get family history with pedigree
  async getFamilyHistory(patientId: string): Promise<FamilyHistory | undefined> {
    // Mock family history
    return {
      patientId,
      relatives: [
        {
          id: 'rel-001',
          relationship: 'Mother',
          sideOfFamily: 'maternal',
          gender: 'F',
          currentAge: 72,
          deceased: false,
          conditions: [
            { name: 'Cancer du sein', ageAtOnset: 55, confirmed: true }
          ]
        },
        {
          id: 'rel-002',
          relationship: 'Maternal Grandmother',
          sideOfFamily: 'maternal',
          gender: 'F',
          deceased: true,
          ageAtDeath: 68,
          causeOfDeath: 'Cancer de l\'ovaire',
          conditions: [
            { name: 'Cancer de l\'ovaire', ageAtOnset: 62, confirmed: true }
          ]
        }
      ],
      riskScores: [
        {
          model: 'Tyrer-Cuzick',
          condition: 'Cancer du sein',
          score: 28.5,
          riskCategory: 'Haut risque',
          calculatedAt: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };
  }

  // Update family history
  async updateFamilyHistory(patientId: string, relatives: FamilyMember[]): Promise<FamilyHistory> {
    const history: FamilyHistory = {
      patientId,
      relatives,
      riskScores: [], // Would be recalculated
      updatedAt: new Date().toISOString()
    };

    return history;
  }

  // Generate personalized treatment recommendations
  async getPersonalizedTreatmentOptions(patientId: string, condition: string): Promise<{
    condition: string;
    genomicFactors: { gene: string; finding: string; impact: string }[];
    recommendedTherapies: {
      therapy: string;
      rationale: string;
      evidenceLevel: string;
      genomicSupport: boolean;
    }[];
    contraindicatedTherapies: {
      therapy: string;
      reason: string;
    }[];
    clinicalTrials?: {
      id: string;
      title: string;
      phase: string;
      targetedMutation?: string;
    }[];
  }> {
    // Mock personalized treatment based on genomic data
    return {
      condition,
      genomicFactors: [
        { gene: 'CYP2D6', finding: 'Métaboliseur lent', impact: 'Réduire dose tamoxifène ou considérer alternative' },
        { gene: 'BRCA2', finding: 'Mutation pathogène', impact: 'Eligible inhibiteurs PARP' }
      ],
      recommendedTherapies: [
        {
          therapy: 'Olaparib',
          rationale: 'Mutation BRCA2 détectée - cible thérapeutique',
          evidenceLevel: 'A',
          genomicSupport: true
        },
        {
          therapy: 'Létrozole',
          rationale: 'Alternative au tamoxifène vu profil CYP2D6',
          evidenceLevel: 'A',
          genomicSupport: true
        }
      ],
      contraindicatedTherapies: [
        {
          therapy: 'Tamoxifène',
          reason: 'Métabolisme réduit (CYP2D6 métaboliseur lent)'
        }
      ],
      clinicalTrials: [
        {
          id: 'NCT04567890',
          title: 'Étude inhibiteur PARP + immunothérapie',
          phase: 'Phase II',
          targetedMutation: 'BRCA1/2'
        }
      ]
    };
  }

  // Helper methods
  private getPhenotypeImplication(phenotype: string): string {
    const implications: Record<string, string> = {
      'Poor Metabolizer': 'Métabolisme lent - risque de toxicité, réduire dose',
      'Intermediate Metabolizer': 'Métabolisme réduit - ajustement possible',
      'Normal Metabolizer': 'Métabolisme normal - dose standard',
      'Rapid Metabolizer': 'Métabolisme rapide - efficacité réduite possible',
      'Ultra-Rapid Metabolizer': 'Métabolisme très rapide - augmenter dose ou alternative'
    };
    return implications[phenotype] || 'Consulter pharmacien clinicien';
  }
}
