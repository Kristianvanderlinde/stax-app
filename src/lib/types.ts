export type Behavior = 'budget' | 'pot';
export type Funding = 'spaar' | 'betaal';
export type Tree = 'uitgaven' | 'inkomsten';

/**
 * Drie soorten voor de gebruiker. In de database is een doelpot een pot met een doelbedrag;
 * 'budget' en 'pot' zijn de opgeslagen waarden.
 */
export type Kind = 'budget' | 'spaarpot' | 'doelpot';

export const KINDS: { value: Kind; label: string; icon: string; uitleg: string }[] = [
	{ value: 'budget', label: 'Budget', icon: 'coins', uitleg: 'Begint elke maand opnieuw. Je ziet het budget naast wat er is uitgegeven.' },
	{ value: 'spaarpot', label: 'Budget · spaart', icon: 'piggy', uitleg: 'Het saldo loopt door: elke maand gaat er iets in, en je kunt er dingen uit betalen.' },
	{ value: 'doelpot', label: 'Budget · spaart · doel', icon: 'aim', uitleg: 'Spaart naar een doel: zoveel geld op een bepaalde datum.' }
];

export function kindOf(n: { effective: Behavior; goal_cents?: number | null; goal?: unknown }): Kind {
	if (n.effective === 'budget') return 'budget';
	return n.goal_cents || n.goal ? 'doelpot' : 'spaarpot';
}

/** Volledig: "Budget", "Budget · spaart" of "Budget · spaart · doel". */
export function kindLabel(k: Kind): string {
	return KINDS.find((x) => x.value === k)?.label ?? k;
}

/** Alleen de opties, voor onder een naam: "", "Spaart" of "Spaart · doel". */
export function kindTag(k: Kind | 'inkomsten'): string {
	return k === 'spaarpot' ? 'Spaart' : k === 'doelpot' ? 'Spaart · doel' : '';
}

export interface Category {
	id: number;
	parent_id: number | null;
	tree: Tree;
	name: string;
	behavior: Behavior | null;
	monthly_cents: number | null;
	opening_cents: number;
	start_month: string | null;
	goal_cents: number | null;
	goal_date: string | null;
	funding: Funding | null;
	icon: string | null;
	sort: number;
	archived: number;
}

export interface CatNode extends Category {
	children: CatNode[];
	depth: number;
	/** Namen van de bovenliggende mappen, zonder de wortel. */
	path: string[];
	effective: Behavior;
	/** Bij een pot: staat het geld op de spaar- of op de betaalrekening. */
	effFunding: Funding;
	effIcon: string | null;
}

/** Platte categorie zoals de keuzelijst in de browser hem nodig heeft. */
export interface CatOption {
	id: number;
	tree: Tree;
	name: string;
	label: string;
	depth: number;
	/** Groep (of wortel): telt alleen op, je kunt er niets op boeken. */
	isGroup: boolean;
	effective: Behavior;
	effFunding: Funding;
	kind: Kind;
	/** Een spaarpot op de spaarrekening. */
	savings: boolean;
	/** De groep waar dit budget direct in staat. */
	parent: number | null;
	icon: string | null;
	/** Naam van de hoofdmap waar deze map onder valt (leeg voor de wortel). */
	group: string;
}

export interface Split {
	category_id: number;
	amount_cents: number;
	source?: string;
	/** 0 = betaald van de lopende rekening; de pot blijft gelijk. */
	from_pot?: number;
}

export interface Transaction {
	id: number;
	account_id: number;
	booking_date: string;
	amount_cents: number;
	counterparty: string | null;
	counterparty_iban: string | null;
	description: string;
	raw_info: string;
	bank_code: string | null;
	mcc: string | null;
	transfer_account_id: number | null;
	excluded: number;
	note: string | null;
}

export interface GoalStats {
	target: number;
	date: string | null;
	/** Deel van het doel dat er al is, 0–1 (kan boven 1). */
	progress: number;
	/** Met een doeldatum: wat er volgens schema nu zou moeten zijn. */
	expected: number | null;
	/** Met een doeldatum: wat er per maand nog bij moet om het doel te halen. */
	perMonth: number | null;
	monthsLeft: number | null;
}

export interface NodeStats {
	id: number;
	name: string;
	tree: Tree;
	depth: number;
	path: string[];
	effective: Behavior;
	funding: Funding;
	icon: string | null;
	monthly: number | null;
	/** Standaardbedrag dat deze maand geldt, en of deze maand daarvan afwijkt. */
	budgetTemplate: number | null;
	budgetOverride: boolean;
	/** Saldo van ingedeelde boekingen deze maand, zonder inleg; negatief = uitgegeven. Hele tak. */
	flow: number;
	/** Idem, alleen boekingen die direct aan deze map hangen ("overig"). */
	ownFlow: number;
	/** Uitgaven op potten deze maand die niet uit de pot kwamen (van de lopende rekening). Hele tak. */
	outside: number;
	/** Idem voor de pot zelf, zonder submappen. */
	ownPot: number;
	ownInleg: number;
	isPot: boolean;
	/** Saldo van alle potten in deze tak aan het eind van de maand. */
	pot: number;
	/** Idem, alleen potten waarvan het geld op de spaarrekening staat. */
	potSpaar: number;
	/** Inleg in potten deze maand: gepland (maandbedragen) en echt binnengekomen. */
	inlegPlanned: number;
	inlegActual: number;
	/** Uitgaven uit spaarpotten die nog van de spaarrekening opgenomen moeten worden. Hele tak. */
	toWithdraw: number;
	hasPot: boolean;
	/** Alleen bij een budget met maandbedrag: wat er nog over is deze maand. */
	available: number | null;
	goal: GoalStats | null;
	children: NodeStats[];
}
