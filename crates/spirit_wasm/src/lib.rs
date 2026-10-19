//! WebAssembly bindings for SpiritContractEvoIdle

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn get_engine_version() -> String {
    "0.2.0-wasm".to_string()
}

#[wasm_bindgen]
pub fn ping() -> bool {
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_version() {
        assert_eq!(get_engine_version(), "0.2.0-wasm");
    }
}
