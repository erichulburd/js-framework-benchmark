import { Benchmark, BenchmarkType, convertToMap, DisplayMode, Framework, FrameworkType, RawResult, Result, ResultTableData, SORT_BY_GEOMMEAN_CPU, categories } from "./Common"
import {benchmarks as benchmark_orig, frameworks, results as rawResults} from './results';

// Temporarily disable script bootup time
//const benchmarks = benchmark_orig;
const benchmarks = benchmark_orig.filter(b => b.id!=='32_startup-bt');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jStat: any = require('jStat').jStat;

const results: Result[] = (rawResults as RawResult[]).map(res => Object.assign(({framework: res.f, benchmark: res.b, values: res.v}),
    {mean: res.v ? jStat.mean(res.v) : Number.NaN,
    median: res.v ? jStat.median(res.v) : Number.NaN,
    standardDeviation: res.v ? jStat.stdev(res.v, true):  Number.NaN}));

const removeKeyedSuffix = (value: string) => {
    if  (value.endsWith('-non-keyed')) return value.substring(0,value.length-10)
    else if (value.endsWith('-keyed')) return value.substring(0,value.length-6)
    return value;
}
const mappedFrameworks = frameworks.map(f => ({name: f.name, displayname: removeKeyedSuffix(f.name), issues: f.issues ?? [], type:f.keyed ? FrameworkType.KEYED : FrameworkType.NON_KEYED}));

const allBenchmarks = benchmarks.reduce((set, b) => set.add(b), new Set<Benchmark>() );
const allFrameworks = mappedFrameworks.reduce((set, f) => set.add(f), new Set<Framework>() );
const resultLookup = convertToMap(results);

interface BenchmarkLists {
    [idx: number]: Benchmark[];    
}
interface FrameworkLists {
    [idx: number]: Framework[];    
}
interface ResultTables {
    [idx: number]: ResultTableData|undefined;  
}
interface CompareWith {
    [idx: number]: Framework|undefined;  
}

export interface State {
    benchmarkLists: BenchmarkLists;
    frameworkLists: FrameworkLists;
    benchmarks: Array<Benchmark>;
    frameworks: Array<Framework>;
    selectedBenchmarks: Set<Benchmark>;
    selectedFrameworksDropDown: Set<Framework>;
    resultTables: ResultTables;
    sortKey: string;
    displayMode: DisplayMode;
    compareWith: CompareWith;
    categories: Set<number>;
}

export const areAllBenchmarksSelected = (state: State, type: BenchmarkType) => state.benchmarkLists[type].every(b => state.selectedBenchmarks.has(b))
export const isNoneBenchmarkSelected = (state: State, type: BenchmarkType) => state.benchmarkLists[type].every(b => !state.selectedBenchmarks.has(b))

export const areAllFrameworksSelected = (state: State, type: FrameworkType) => state.frameworkLists[type].every(f => state.selectedFrameworksDropDown.has(f))
export const isNoneFrameworkSelected = (state: State, type: FrameworkType) => state.frameworkLists[type].every(f => !state.selectedFrameworksDropDown.has(f))


const preInitialState: State = {    
    // static
    benchmarks: benchmarks,
    benchmarkLists: {
        [BenchmarkType.CPU]: benchmarks.filter(b => b.type === BenchmarkType.CPU),
        [BenchmarkType.MEM]: benchmarks.filter(b => b.type === BenchmarkType.MEM), 
        [BenchmarkType.STARTUP]: benchmarks.filter(b => b.type === BenchmarkType.STARTUP)
    },
    frameworks: mappedFrameworks,
    frameworkLists: {
        [FrameworkType.KEYED]: mappedFrameworks.filter(f => f.type === FrameworkType.KEYED),
        [FrameworkType.NON_KEYED]: mappedFrameworks.filter(f => f.type === FrameworkType.NON_KEYED),
    },
    // dynamic
    selectedBenchmarks: allBenchmarks,
    selectedFrameworksDropDown: allFrameworks,
    sortKey: SORT_BY_GEOMMEAN_CPU,
    displayMode: DisplayMode.DisplayMedian,
    resultTables: {
        [FrameworkType.KEYED]: undefined,
        [FrameworkType.NON_KEYED]: undefined
    },
    compareWith: {
        [FrameworkType.KEYED]: undefined,
        [FrameworkType.NON_KEYED]: undefined
    },
    categories: new Set([1,2,3,4])
}

function updateResultTable({frameworks, benchmarks, selectedFrameworksDropDown: selectedFrameworks, selectedBenchmarks, sortKey, displayMode, compareWith, categories}: State) {
  return {
      [FrameworkType.KEYED]: new ResultTableData(frameworks, benchmarks, resultLookup, selectedFrameworks, selectedBenchmarks, FrameworkType.KEYED, sortKey, displayMode, compareWith[FrameworkType.KEYED], categories),
      [FrameworkType.NON_KEYED]: new ResultTableData(frameworks, benchmarks, resultLookup, selectedFrameworks, selectedBenchmarks, FrameworkType.NON_KEYED, sortKey, displayMode, compareWith[FrameworkType.NON_KEYED], categories)
  }
}

const initialState: State = {
    ...preInitialState,
    resultTables: updateResultTable(preInitialState)
}
interface SelectFrameworkAction { type: 'SELECT_FRAMEWORK'; data: {framework: Framework; add: boolean}}
export const selectFramework = (framework: Framework, add: boolean): SelectFrameworkAction => {
  return {type: 'SELECT_FRAMEWORK', data: {framework, add}}
}

interface SelectAllFrameworksAction { type: 'SELECT_ALL_FRAMEWORKS'; data: {frameworkType: FrameworkType; add: boolean}}
export const selectAllFrameworks = (frameworkType: FrameworkType, add: boolean): SelectAllFrameworksAction => {
  return {type: 'SELECT_ALL_FRAMEWORKS', data: {frameworkType, add}}
}

interface SelectCategoryAction { type: 'SELECT_CATEGORY'; data: {categoryId: number; add: boolean}}
export const selectCategory = (categoryId: number, add: boolean): SelectCategoryAction => {
  return {type: 'SELECT_CATEGORY', data: {categoryId, add}}
}

interface SelectAllCategoriesAction { type: 'SELECT_ALL_CATEGORIES'; data: {add: boolean}}
export const selectAllCategories = (add: boolean): SelectAllCategoriesAction => {
  return {type: 'SELECT_ALL_CATEGORIES', data: {add}}
}

interface SelectBenchmarkAction { type: 'SELECT_BENCHMARK'; data: {benchmark: Benchmark; add: boolean}}
export const selectBenchmark = (benchmark: Benchmark, add: boolean): SelectBenchmarkAction => {
  return {type: 'SELECT_BENCHMARK', data: {benchmark, add}}
}

interface SelectAllBenchmarksAction { type: 'SELECT_ALL_BENCHMARKS'; data: {benchmarkType: BenchmarkType; add: boolean}}
export const selectAllBenchmarks = (benchmarkType: BenchmarkType, add: boolean): SelectAllBenchmarksAction => {
  return {type: 'SELECT_ALL_BENCHMARKS', data: {benchmarkType, add}}
}

interface SelectDisplayModeAction { type: 'SELECT_DISPLAYMODE'; data: {displayMode: DisplayMode}}
export const selectDisplayMode = (displayMode: DisplayMode): SelectDisplayModeAction => {
  return {type: 'SELECT_DISPLAYMODE', data: {displayMode}}
}

interface CompareAction { type: 'COMPARE'; data: {framework: Framework}}
export const compare = (framework: Framework): CompareAction => {
  return {type: 'COMPARE', data: {framework}}
}

interface StopCompareAction { type: 'STOP_COMPARE'; data: {framework: Framework}}
export const stopCompare = (framework: Framework): StopCompareAction => {
  return {type: 'STOP_COMPARE', data: {framework}}
}

interface SortAction { type: 'SORT'; data: {sortKey: string}}
export const sort = (sortKey: string): SortAction => {
  return {type: 'SORT', data: {sortKey}}
}
type Action = SelectFrameworkAction | SelectAllFrameworksAction | SelectBenchmarkAction | SelectAllBenchmarksAction 
  | SelectDisplayModeAction | CompareAction |StopCompareAction | SortAction
  | SelectCategoryAction | SelectAllCategoriesAction;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const reducer = (state = initialState, action: Action): State => {
    console.log("reducer", action)
    switch (action.type) {
        case 'SELECT_FRAMEWORK': {
            const newSelectedFramework = new Set(state.selectedFrameworksDropDown);
            if (action.data.add) newSelectedFramework.add(action.data.framework);
            else newSelectedFramework.delete(action.data.framework);
            const t = {...state, selectedFrameworksDropDown: newSelectedFramework};
            return {...t, resultTables: updateResultTable(t)};
        }
        case 'SELECT_ALL_FRAMEWORKS': {
            const newSelectedFramework = new Set(state.selectedFrameworksDropDown);
            for (const f of (action.data.frameworkType === FrameworkType.KEYED ? state.frameworkLists[FrameworkType.KEYED] : state.frameworkLists[FrameworkType.NON_KEYED])) {
                if (action.data.add) newSelectedFramework.add(f);
                else newSelectedFramework.delete(f);
            }
            const t = {...state, selectedFrameworksDropDown: newSelectedFramework};
            return {...t, resultTables: updateResultTable(t)};
        }
        case 'SELECT_BENCHMARK': {
            const newSelectedBenchmark = new Set(state.selectedBenchmarks);
            if (action.data.add) newSelectedBenchmark.add(action.data.benchmark);
            else newSelectedBenchmark.delete(action.data.benchmark);
            const t = {...state, selectedBenchmarks: newSelectedBenchmark};
            return {...t, resultTables: updateResultTable(t)};
        }
        case 'SELECT_ALL_BENCHMARKS': {
            const newSelectedBenchmark = new Set(state.selectedBenchmarks);
            for (const b of state.benchmarkLists[action.data.benchmarkType]) {
                if (action.data.add) newSelectedBenchmark.add(b)
                else newSelectedBenchmark.delete(b)
            }
            const t = {...state, selectedBenchmarks: newSelectedBenchmark}
            return {...t, resultTables: updateResultTable(t)}
        }
        case 'SELECT_DISPLAYMODE': {
            const t = {...state, displayMode: action.data.displayMode};
            return {...t, resultTables: updateResultTable(t)};
        }
        case 'COMPARE': {
            const compareWith = {...state.compareWith};
            compareWith[action.data.framework.type] = action.data.framework;
            
            const t = {...state, compareWith: compareWith};
            return {...t, resultTables: updateResultTable(t)};
        }
        case 'STOP_COMPARE': {
            const compareWith = {...state.compareWith};
            compareWith[action.data.framework.type] = undefined;
            const t = {...state, compareWith: compareWith};
            return {...t, resultTables: updateResultTable(t)};
          }
          case 'SORT': {
            const t = {...state, sortKey: action.data.sortKey};
            return {...t, resultTables: updateResultTable(t)};
          }
          case 'SELECT_CATEGORY': {
            const categories  = new Set(state.categories);
            if (action.data.add) {
              categories.add(action.data.categoryId);
            } else {
              categories.delete(action.data.categoryId);
            }
            const t = {...state, categories};
            return {...t, resultTables: updateResultTable(t)};
        }
        case 'SELECT_ALL_CATEGORIES': {
          const newCategories = (action.data.add) ? new Set(categories.map(c => c.id)) : new Set<number>(); 
          const t = {...state, categories: newCategories};
          return {...t, resultTables: updateResultTable(t)};
        }
        default:
            return state;
    }
  }