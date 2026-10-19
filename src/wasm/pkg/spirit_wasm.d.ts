/* tslint:disable */
/* eslint-disable */

export class WasmSimulationEngine {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Instant 24-hour fast-forward calculation (<1ms in Wasm)
     */
    calculate_offline_gains(elapsed_seconds: bigint, highest_stage: number, party_power: bigint, current_energy: number, max_energy: number, force_claim: boolean): any;
    /**
     * Initializes a combat session from JS Values (arrays of CombatUnit)
     */
    init_combat(party_val: any, enemies_val: any): void;
    is_defeat(): boolean;
    is_victory(): boolean;
    /**
     * Instant math helper: DamageTaken = RawDamage * (350 / (350 + DEF))
     */
    mitigate_damage(raw_damage: bigint, def: bigint): bigint;
    constructor(seed: bigint);
    set_seed(seed: bigint): void;
    /**
     * Advances 1 discrete combat tick (e.g. 250ms) and returns structured CombatEvent objects
     */
    step_tick(delta_sec: number): any;
}

export function get_engine_version(): string;

export function ping(): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmsimulationengine_free: (a: number, b: number) => void;
    readonly get_engine_version: () => [number, number];
    readonly ping: () => number;
    readonly wasmsimulationengine_calculate_offline_gains: (a: number, b: bigint, c: number, d: bigint, e: number, f: number, g: number) => [number, number, number];
    readonly wasmsimulationengine_init_combat: (a: number, b: any, c: any) => [number, number];
    readonly wasmsimulationengine_is_defeat: (a: number) => number;
    readonly wasmsimulationengine_is_victory: (a: number) => number;
    readonly wasmsimulationengine_mitigate_damage: (a: number, b: bigint, c: bigint) => bigint;
    readonly wasmsimulationengine_new: (a: bigint) => number;
    readonly wasmsimulationengine_set_seed: (a: number, b: bigint) => void;
    readonly wasmsimulationengine_step_tick: (a: number, b: number) => [number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
