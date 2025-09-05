type Goat = {
	name: string;
	powerLevel: number;
	isGrumpy: boolean;
};
type GoatSecondary = {
	name: string[];
	powerLevel: Record<string, number>;
	isGrumpy: boolean[];
};

type GoatKeys = keyof Goat;
const k: GoatKeys = 'name';

const getGoatField = <K extends keyof Goat>(goat: Goat, key: K): Goat[K] => {
	return goat[key];
};

const getGoatSecondaryField = <K extends keyof Goat>(goat: Goat, key: K): GoatSecondary[K] => {
	return goat[key];
};
