use wasm_bindgen::prelude::*;
use rand::{seq::SliceRandom, SeedableRng};
use rand_chacha::ChaCha20Rng;
use getrandom::getrandom;

fn make_rng() -> ChaCha20Rng {
    let mut seed = [0u8; 32];
    getrandom(&mut seed).unwrap_or(());
    ChaCha20Rng::from_seed(seed)
}

fn has_consecutive_run(nums: &[u8], run_len: usize) -> bool {
    if nums.len() < run_len { return false; }
    let mut current_run = 1usize;
    for i in 1..nums.len() {
        if nums[i] == nums[i-1] + 1 { current_run += 1; }
        else { current_run = 1; }
        if current_run >= run_len { return true; }
    }
    false
}

fn has_arithmetic_progression(nums: &[u8], min_len: usize) -> bool {
    let n = nums.len();
    for i in 0..n {
        for j in i+1..n {
            let diff = nums[j] as i16 - nums[i] as i16;
            let step = (j - i) as i16;
            if diff % step != 0 { continue; }
            let d = diff / step;
            let mut len = 2usize;
            let mut last = nums[j] as i16;
            for k in j+1..n {
                if nums[k] as i16 - last == d { len += 1; last = nums[k] as i16; }
            }
            if len >= min_len { return true; }
        }
    }
    false
}

fn too_many_birthdays_like(nums: &[u8], threshold: usize) -> bool {
    nums.iter().filter(|&&x| x <= 31).count() >= threshold
}

fn acceptable(nums: &[u8]) -> bool {
    // Heuristiken: keine langen aufeinanderfolgenden Reihen (>=4),
    // keine arithmetischen Progressionen (>=4),
    // nicht zu viele Zahlen <=31 (z.B. Geburtstage) (>=5)
    if has_consecutive_run(nums, 4) { return false; }
    if has_arithmetic_progression(nums, 4) { return false; }
    if too_many_birthdays_like(nums, 5) { return false; }
    true
}

#[wasm_bindgen]
pub fn generate_lotto() -> Vec<u8> {
    let mut rng = make_rng();
    let mut numbers: Vec<u8> = (1..=49).collect();
    let mut last_valid = Vec::new();
    for _attempt in 0..200 {
        numbers.shuffle(&mut rng);
        let mut pick = numbers[..6].to_vec();
        pick.sort_unstable();
        if acceptable(&pick) { return pick; }
        last_valid = pick;
    }
    // Falls nach vielen Versuchen nichts akzeptables gefunden wurde, zurückgeben
    last_valid
}

// Hilfsfunktion für Tests
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_consecutive_run() {
        assert!(has_consecutive_run(&[1,2,3,4,10,20], 4));
        assert!(!has_consecutive_run(&[1,2,4,5,6,8],4));
    }

    #[test]
    fn test_birthdays() {
        assert!(too_many_birthdays_like(&[1,2,3,4,5,49],5));
        assert!(!too_many_birthdays_like(&[1,10,20,40,45,49],5));
    }
}
