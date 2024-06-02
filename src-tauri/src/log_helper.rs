use std::time::Instant;

pub fn measure_fn_time<F, Ret>(name: &str, func: F) -> Ret
    where F: FnOnce() -> Ret
{
    let start = Instant::now();
    let res = func();
    let duration = start.elapsed();

    println!("Time elapsed in {} is: {:?}", name, duration);

    return res;
}
