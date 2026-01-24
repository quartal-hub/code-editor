async function testConnection() {
    const username = "tilijukka";
    const password = "pantteri";
    // Use fetch with custom Origin and show all response headers for CORS debug
    const url = "https://test-opencode.salaxy.com/project";
    const corsTestResponse = await fetch(url, {
        method: "OPTIONS",
        headers: {
            // Authorization: `Basic ${btoa(`${username}:${password}`)}`,
            "Referer": "http://localhost:5176/",
            "Origin": "http://localhost:5176",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
    });

    console.log("---- CORS Response Headers ----");
    for (const [key, value] of corsTestResponse.headers.entries()) {
        console.log(`${key}: ${value}`);
    }
    console.log(corsTestResponse.status);
    console.log(corsTestResponse.statusText);
    console.log(corsTestResponse.headers);
    console.log(corsTestResponse.body);
    console.log("-------------------------------");
    /*
    const response = await fetch("https://test-opencode.salaxy.com/project", {
        headers: {
            Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
    });
    const data = await response.json();
    console.log(data);
    */
    
}

await testConnection();