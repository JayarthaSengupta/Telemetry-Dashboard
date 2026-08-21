let pieChart = null;
let barChart = null;

document.addEventListener("DOMContentLoaded", () => {
    fetchLogs();

    // Refresh telemetry every 5 seconds
    setInterval(fetchLogs, 5000);
});


async function fetchLogs() {
    try {
        const response = await fetch("/data");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        console.log("Telemetry received:", data);

        if (!Array.isArray(data)) {
            throw new Error("Server did not return an array");
        }

        populateTable(data);
        createCharts(data);

    } catch (error) {
        console.error("Error loading telemetry:", error);
    }
}


function populateTable(data) {
    const tbody = document.getElementById("data-table");

    if (!tbody) {
        console.error("Table body #data-table not found");
        return;
    }

    tbody.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");

        let statusHTML;

        if (row.safe === true || row.safe === "true") {
            statusHTML = '<span class="safe">✅ Safe</span>';
        }
        else if (row.safe === false || row.safe === "false") {
            statusHTML = '<span class="unsafe">❌ Unsafe</span>';
        }
        else {
            statusHTML = '<span class="invalid">⚠️ Invalid</span>';
        }

        tr.innerHTML = `
            <td>${formatTimestamp(row.timestamp)}</td>
            <td>${row.ip || "N/A"}</td>
            <td>${row.user || "N/A"}</td>
            <td>${row.operation_type || "N/A"}</td>
            <td>${statusHTML}</td>
        `;

        tbody.appendChild(tr);
    });
}


function formatTimestamp(timestamp) {
    if (!timestamp) {
        return "N/A";
    }

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
        return timestamp;
    }

    return date.toLocaleString();
}


function createCharts(data) {
    let safe = 0;
    let unsafe = 0;
    let invalid = 0;

    data.forEach(row => {
        if (row.safe === true || row.safe === "true") {
            safe++;
        }
        else if (row.safe === false || row.safe === "false") {
            unsafe++;
        }
        else {
            invalid++;
        }
    });

    const chartData = [safe, unsafe, invalid];

    // Destroy previous charts
    if (pieChart) {
        pieChart.destroy();
    }

    if (barChart) {
        barChart.destroy();
    }


    // Pie Chart
    const pieCtx = document.getElementById("pieChart");

    if (pieCtx) {
        pieChart = new Chart(pieCtx, {
            type: "pie",

            data: {
                labels: ["Safe", "Unsafe", "Invalid"],

                datasets: [{
                    data: chartData,
                    backgroundColor: [
                        "#28a745",
                        "#dc3545",
                        "#ffc107"
                    ]
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }


    // Bar Chart
    const barCtx = document.getElementById("barChart");

    if (barCtx) {
        barChart = new Chart(barCtx, {
            type: "bar",

            data: {
                labels: ["Safe", "Unsafe", "Invalid"],

                datasets: [{
                    label: "Operations",
                    data: chartData,
                    backgroundColor: [
                        "#28a745",
                        "#dc3545",
                        "#ffc107"
                    ]
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }


    // Summary
    const summary = document.getElementById("summary-text");

    if (summary) {
        summary.textContent =
            `Safe: ${safe} | Unsafe: ${unsafe} | Invalid: ${invalid}`;
    }
}


function exportPDF() {
    const element = document.querySelector("#logTable");

    if (!element) {
        console.error("Telemetry table not found");
        return;
    }

    const options = {
        margin: 0.5,
        filename: "telemetry_report.pdf",

        image: {
            type: "jpeg",
            quality: 0.98
        },

        html2canvas: {
            scale: 2
        },

        jsPDF: {
            unit: "in",
            format: "letter",
            orientation: "portrait"
        }
    };

    if (typeof html2pdf !== "undefined") {
        html2pdf()
            .set(options)
            .from(element)
            .save();
    }
    else {
        alert("PDF export library is not loaded.");
    }
}