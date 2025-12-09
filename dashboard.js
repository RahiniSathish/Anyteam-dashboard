// Chart instances
let charts = {};

// Configuration
const API_BASE_URL = window.location.origin;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Theme management
let currentTheme = localStorage.getItem('theme') || 'dark';

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
    updateChartColors();
}

function updateThemeIcon() {
    const themeIcon = document.getElementById('themeIcon');
    if (!themeIcon) return;
    
    if (currentTheme === 'dark') {
        // Sun icon for dark theme (click to switch to light)
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        `;
    } else {
        // Moon icon for light theme (click to switch to dark)
        themeIcon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        `;
    }
}

function updateChartColors() {
    // Update chart text colors based on theme
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-text').trim() || '#cbd5e1';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim() || 'rgba(148, 163, 184, 0.1)';
    
    // Update all charts
    Object.values(charts).forEach(chart => {
        if (chart && chart.options) {
            // Update scales
            if (chart.options.scales) {
                Object.keys(chart.options.scales).forEach(scaleKey => {
                    const scale = chart.options.scales[scaleKey];
                    if (scale.ticks) {
                        scale.ticks.color = textColor;
                    }
                    if (scale.grid) {
                        scale.grid.color = gridColor;
                    }
                });
            }
            // Update legend
            if (chart.options.plugins && chart.options.plugins.legend) {
                if (chart.options.plugins.legend.labels) {
                    chart.options.plugins.legend.labels.color = textColor;
                }
            }
            chart.update('none');
        }
    });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCharts();
    loadDashboardData();

    // Set up theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Set up refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadDashboardData();
    });

    // Auto-refresh every 5 minutes
    setInterval(loadDashboardData, REFRESH_INTERVAL);
});

// Initialize all charts
function initCharts() {
    // Get theme colors from CSS variables
    const getThemeColor = (property) => {
        return getComputedStyle(document.documentElement).getPropertyValue(property).trim() || 
               (currentTheme === 'dark' ? '#cbd5e1' : '#64748b');
    };
    
    const chartTextColor = getThemeColor('--chart-text');
    const chartGridColor = getThemeColor('--grid-color');
    
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    font: {
                        size: 12,
                        family: 'Inter',
                        weight: '500'
                    },
                    color: chartTextColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: chartTextColor
                },
                grid: {
                    color: chartGridColor
                }
            },
            y: {
                ticks: {
                    color: chartTextColor
                },
                grid: {
                    color: chartGridColor
                }
            }
        }
    };

    // Test Type Breakdown - Smoke vs Regression (Grouped Bar Chart)
    const passRateCtx = document.getElementById('passRateChart').getContext('2d');
    charts.passRate = new Chart(passRateCtx, {
        type: 'bar',
        data: {
            labels: ['Features', 'Test Cases'],
            datasets: [{
                label: 'Smoke Tests',
                data: [0, 0],
                backgroundColor: '#8b5cf6',
                borderRadius: 6
            }, {
                label: 'Regression Tests',
                data: [0, 0],
                backgroundColor: '#14b8a6',
                borderRadius: 6
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: chartTextColor,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: chartGridColor
                    },
                    ticks: {
                        color: chartTextColor,
                        stepSize: 5
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });

    // Test Status by Type Chart
    const distributionCtx = document.getElementById('distributionChart').getContext('2d');
    charts.distribution = new Chart(distributionCtx, {
        type: 'bar',
        data: {
            labels: ['Smoke Tests', 'Regression Tests'],
            datasets: [{
                label: 'Done',
                data: [0, 0],
                backgroundColor: '#8b5cf6',
                borderRadius: 8
            }, {
                label: 'In Progress',
                data: [0, 0],
                backgroundColor: '#14b8a6',
                borderRadius: 8
            }, {
                label: 'Yet to Start',
                data: [0, 0],
                backgroundColor: '#f97316',
                borderRadius: 8
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#cbd5e1'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#cbd5e1'
                    }
                }
            }
        }
    });


    // Features Analysis Chart - Total Cases and Automated Case (Stacked Vertical Bar)
    const moduleCtx = document.getElementById('moduleChart').getContext('2d');
    charts.module = new Chart(moduleCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Cases',
                data: [],
                backgroundColor: '#10b981', // Green for Total Cases
                borderRadius: 4,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
            }, {
                label: 'Automated Case',
                data: [],
                backgroundColor: '#a855f7', // Purple for Automated Cases
                borderRadius: 4,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'x', // Vertical bars
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 10,
                            weight: '500'
                        },
                        color: chartTextColor,
                        maxRotation: 45,
                        minRotation: 45,
                        padding: 5
                    },
                    title: {
                        display: true,
                        text: 'Features/Tasks/Stories',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        color: chartTextColor,
                        padding: { top: 10, bottom: 5 }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: chartGridColor,
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 5,
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: chartTextColor,
                        padding: 8
                    },
                    title: {
                        display: true,
                        text: 'Number of Test Cases',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        color: chartTextColor,
                        padding: { top: 0, bottom: 10 }
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    ...chartDefaults.plugins.legend,
                    display: true,
                    position: 'top',
                    align: 'center',
                    labels: {
                        ...chartDefaults.plugins.legend.labels,
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'rect',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        color: chartTextColor
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    padding: 12,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 12
                    },
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return context[0].label || 'Feature';
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            if (datasetLabel === 'Total Cases') {
                                // For Total Cases (blue), this is actually the manual portion
                                const automated = charts.module.data.datasets[1].data[context.dataIndex] || 0;
                                const total = value + automated;
                                return `Manual Cases: ${value} | Total Cases: ${total}`;
                            } else {
                                // For Automated Case (red)
                                return `Automated Cases: ${value}`;
                            }
                        },
                        footer: function(context) {
                            const manual = charts.module.data.datasets[0].data[context[0].dataIndex] || 0;
                            const automated = charts.module.data.datasets[1].data[context[0].dataIndex] || 0;
                            const totalCases = manual + automated;
                            const automationRate = totalCases > 0 ? ((automated / totalCases) * 100).toFixed(1) : 0;
                            return `Total: ${totalCases} | Automation Rate: ${automationRate}%`;
                        }
                    }
                }
            }
        }
    });

    // Automation Status Breakdown - Horizontal Bar Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    charts.status = new Chart(statusCtx, {
        type: 'bar',
        data: {
            labels: ['Done', 'In Progress', 'Yet to Start'],
            datasets: [{
                label: 'Manual',
                data: [0, 0, 0],
                backgroundColor: '#8b5cf6',
                borderRadius: 6
            }, {
                label: 'Automated',
                data: [0, 0, 0],
                backgroundColor: '#14b8a6',
                borderRadius: 6
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: chartGridColor
                    },
                    ticks: {
                        color: chartTextColor,
                        stepSize: 5
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: chartTextColor,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.x || 0;
                            const status = context.label || '';
                            return `${label} TCs (${status}): ${value}`;
                        }
                    }
                }
            }
        }
    });

    // Automation Chart - Manual vs Automated (Pie Chart)
    const automationCtx = document.getElementById('automationChart').getContext('2d');
    charts.automation = new Chart(automationCtx, {
        type: 'pie',
        data: {
            labels: ['Manual Test Cases', 'Automated Test Cases'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#8b5cf6', '#14b8a6'],
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    ...chartDefaults.plugins.legend,
                    position: 'bottom',
                    labels: {
                        ...chartDefaults.plugins.legend.labels,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

}

// Load dashboard data from API
async function loadDashboardData() {
    try {
        showLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/dashboard-data`);
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Always try to parse JSON, even for error responses
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            throw new Error(`Invalid server response: ${response.status} ${response.statusText}`);
        }

        if (data.success) {
            updateDashboard(data);
            updateLastRefreshTime();
            hideErrorMessage();
        } else {
            // Handle server-side errors (like missing credentials)
            const errorMsg = data.error || 'Failed to load dashboard data';
            let userFriendlyMsg = errorMsg;
            
            if (errorMsg.includes('spreadsheet') || errorMsg.includes('Sheet')) {
                userFriendlyMsg = 'Unable to access Google Sheet. Please ensure the sheet is set to "Anyone with the link can view" for public access.';
            }
            
            showError(userFriendlyMsg);
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        let errorMsg = 'Error loading dashboard data. ';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMsg += 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('HTTP 404')) {
            errorMsg += 'API endpoint not found. Please check the deployment configuration.';
        } else if (error.message.includes('HTTP 500') || error.message.includes('500')) {
            errorMsg += 'Server error occurred. The Google Sheet may not be accessible. Please check server logs.';
        } else if (error.message.includes('HTTP')) {
            errorMsg += error.message;
        } else {
            errorMsg += error.message;
        }
        
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            apiUrl: `${API_BASE_URL}/api/dashboard-data`
        });
        
        showError(errorMsg);
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

// Update all dashboard elements
function updateDashboard(data) {
    // Ensure we have valid data
    const overall = data.overall || { total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 };
    const smokeTests = data.smokeTests || { total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0, testsByModule: {}, testsByPriority: {}, recentTests: [] };
    const regressionTests = data.regressionTests || { total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0, testsByModule: {}, testsByPriority: {}, recentTests: [] };
    
    // Calculate detailed breakdowns
    const smokePassed = smokeTests.passed || 0;
    const regressionPassed = regressionTests.passed || 0;
    const smokeInProgress = smokeTests.skipped || 0;
    const regressionInProgress = regressionTests.skipped || 0;
    const smokePending = smokeTests.failed || 0;
    const regressionPending = regressionTests.failed || 0;
    const smokeTotal = smokeTests.total || 0;
    const regressionTotal = regressionTests.total || 0;
    const smokeManual = smokeTests.totalManual || 0;
    const regressionManual = regressionTests.totalManual || 0;
    const smokeAutomated = smokeTests.totalAutomated || 0;
    const regressionAutomated = regressionTests.totalAutomated || 0;
    const smokeTotalCases = smokeTests.totalTestCases || 0;
    const regressionTotalCases = regressionTests.totalTestCases || 0;
    
    // Calculate percentages
    const totalForPercentage = overall.total || 1;
    const passedPercentage = Math.round((overall.passed / totalForPercentage) * 100) || 0;
    const inProgressPercentage = Math.round((overall.skipped / totalForPercentage) * 100) || 0;
    const pendingPercentage = Math.round((overall.failed / totalForPercentage) * 100) || 0;
    
    const totalCasesForPercentage = overall.totalTestCases || 1;
    const manualPercentage = Math.round((overall.totalManual / totalCasesForPercentage) * 100) || 0;
    const automatedPercentage = Math.round((overall.totalAutomated / totalCasesForPercentage) * 100) || 0;
    
    const smokeAutomationRate = smokeTotalCases > 0 ? Math.round((smokeAutomated / smokeTotalCases) * 100) : 0;
    const regressionAutomationRate = regressionTotalCases > 0 ? Math.round((regressionAutomated / regressionTotalCases) * 100) : 0;
    
    // Update summary cards
    document.getElementById('totalTests').textContent = overall.total || 0;
    document.getElementById('passedTests').textContent = overall.passed || 0;
    document.getElementById('failedTests').textContent = overall.failed || 0;
    document.getElementById('skippedTests').textContent = overall.skipped || 0;
    
    // Update detailed breakdowns - Completed
    document.getElementById('smokePassed').textContent = smokePassed;
    document.getElementById('regressionPassed').textContent = regressionPassed;
    document.getElementById('passedPercentage').textContent = `${passedPercentage}%`;
    
    // Update detailed breakdowns - In Progress
    document.getElementById('smokeInProgress').textContent = smokeInProgress;
    document.getElementById('regressionInProgress').textContent = regressionInProgress;
    document.getElementById('inProgressPercentage').textContent = `${inProgressPercentage}%`;
    
    // Update detailed breakdowns - Yet to Start
    document.getElementById('smokePending').textContent = smokePending;
    document.getElementById('regressionPending').textContent = regressionPending;
    document.getElementById('pendingPercentage').textContent = `${pendingPercentage}%`;
    
    // Update detailed breakdowns - Total Features
    document.getElementById('smokeTotal').textContent = smokeTotal;
    document.getElementById('regressionTotal').textContent = regressionTotal;
    
    // Update new summary cards
    const totalManualEl = document.getElementById('totalManual');
    const totalAutomatedEl = document.getElementById('totalAutomated');
    const totalTestCasesEl = document.getElementById('totalTestCases');
    const automationRateEl = document.getElementById('automationRate');
    
    if (totalManualEl) totalManualEl.textContent = overall.totalManual || 0;
    if (totalAutomatedEl) totalAutomatedEl.textContent = overall.totalAutomated || 0;
    if (totalTestCasesEl) totalTestCasesEl.textContent = overall.totalTestCases || 0;
    if (automationRateEl) automationRateEl.textContent = `${overall.automationRate || 0}%`;
    
    // Update detailed breakdowns - Manual
    document.getElementById('smokeManual').textContent = smokeManual;
    document.getElementById('regressionManual').textContent = regressionManual;
    document.getElementById('manualPercentage').textContent = `${manualPercentage}%`;
    
    // Update detailed breakdowns - Automated
    document.getElementById('smokeAutomated').textContent = smokeAutomated;
    document.getElementById('regressionAutomated').textContent = regressionAutomated;
    document.getElementById('automatedPercentage').textContent = `${automatedPercentage}%`;
    
    // Update detailed breakdowns - Total Test Cases
    document.getElementById('smokeTotalCases').textContent = smokeTotalCases;
    document.getElementById('regressionTotalCases').textContent = regressionTotalCases;
    
    // Update detailed breakdowns - Automation Rate
    document.getElementById('smokeAutomationRate').textContent = `${smokeAutomationRate}%`;
    document.getElementById('regressionAutomationRate').textContent = `${regressionAutomationRate}%`;

    // Update Test Type Breakdown chart - Smoke vs Regression
    charts.passRate.data.datasets[0].data = [
        smokeTests.total || 0,           // Smoke Features
        smokeTests.totalTestCases || 0   // Smoke Test Cases
    ];
    charts.passRate.data.datasets[1].data = [
        regressionTests.total || 0,           // Regression Features
        regressionTests.totalTestCases || 0   // Regression Test Cases
    ];
    charts.passRate.update('none');

    // Update Test Status by Type chart
    charts.distribution.data.datasets[0].label = 'Done';
    charts.distribution.data.datasets[0].data = [
        smokeTests.passed || 0,
        regressionTests.passed || 0
    ];
    charts.distribution.data.datasets[0].backgroundColor = '#8b5cf6';
    
    charts.distribution.data.datasets[1].label = 'In Progress';
    charts.distribution.data.datasets[1].data = [
        smokeTests.skipped || 0,
        regressionTests.skipped || 0
    ];
    charts.distribution.data.datasets[1].backgroundColor = '#14b8a6';
    
    charts.distribution.data.datasets[2].label = 'Yet to Start';
    charts.distribution.data.datasets[2].data = [
        smokeTests.failed || 0,
        regressionTests.failed || 0
    ];
    charts.distribution.data.datasets[2].backgroundColor = '#f97316';
    
    charts.distribution.update('none');

    // Update Automation Status Breakdown chart - Manual vs Automated by Status
    // Calculate proportional distribution of manual/automated across statuses
    const totalFeatures = overall.total || 1;
    const manualRatio = (overall.totalManual || 0) / (overall.totalTestCases || 1);
    const automatedRatio = (overall.totalAutomated || 0) / (overall.totalTestCases || 1);

    const statusBreakdown = {
        done: (smokeTests.statusBreakdown?.done || 0) + (regressionTests.statusBreakdown?.done || 0),
        inprogress: (smokeTests.statusBreakdown?.inprogress || 0) + (regressionTests.statusBreakdown?.inprogress || 0),
        'yet to start': (smokeTests.statusBreakdown?.['yet to start'] || 0) + (regressionTests.statusBreakdown?.['yet to start'] || 0)
    };

    if (charts.status) {
        // Approximate manual test cases per status (proportional to total)
        charts.status.data.datasets[0].data = [
            Math.round((smokeTests.totalManual || 0) * (smokeTests.passed / Math.max(smokeTests.total, 1)) +
                       (regressionTests.totalManual || 0) * (regressionTests.passed / Math.max(regressionTests.total, 1))),
            Math.round((smokeTests.totalManual || 0) * (smokeTests.skipped / Math.max(smokeTests.total, 1)) +
                       (regressionTests.totalManual || 0) * (regressionTests.skipped / Math.max(regressionTests.total, 1))),
            Math.round((smokeTests.totalManual || 0) * (smokeTests.failed / Math.max(smokeTests.total, 1)) +
                       (regressionTests.totalManual || 0) * (regressionTests.failed / Math.max(regressionTests.total, 1)))
        ];

        // Approximate automated test cases per status (proportional to total)
        charts.status.data.datasets[1].data = [
            Math.round((smokeTests.totalAutomated || 0) * (smokeTests.passed / Math.max(smokeTests.total, 1)) +
                       (regressionTests.totalAutomated || 0) * (regressionTests.passed / Math.max(regressionTests.total, 1))),
            Math.round((smokeTests.totalAutomated || 0) * (smokeTests.skipped / Math.max(smokeTests.total, 1)) +
                       (regressionTests.totalAutomated || 0) * (regressionTests.skipped / Math.max(regressionTests.total, 1))),
            Math.round((smokeTests.totalAutomated || 0) * (smokeTests.failed / Math.max(smokeTests.total, 1)) +
                       (regressionTests.totalAutomated || 0) * (regressionTests.failed / Math.max(regressionTests.total, 1)))
        ];

        charts.status.update('none');
    }

    // Update automation chart
    if (charts.automation) {
        charts.automation.data.datasets[0].data = [
            overall.totalManual || 0,
            overall.totalAutomated || 0
        ];
        charts.automation.update('none');
    }

    // Update Features Analysis chart - Total Cases and Automated Case (Stacked)
    const automationData = combineAutomationData(
        smokeTests.automationByModule || {},
        regressionTests.automationByModule || {}
    );
    if (Object.keys(automationData).length > 0) {
        // Sort features by total test cases (descending) for better readability
        const modules = Object.keys(automationData).sort((a, b) => {
            const totalA = (automationData[a].total || 0);
            const totalB = (automationData[b].total || 0);
            return totalB - totalA;
        });
        
        // Limit to top 15 features for readability
        const topModules = modules.slice(0, 15);
        
        // For stacked chart: 
        // Bottom stack (blue) = Manual Cases (Total - Automated)
        // Top stack (red) = Automated Cases
        const totalCases = topModules.map(m => automationData[m].total || 0);
        const automatedCounts = topModules.map(m => automationData[m].automated || 0);
        const manualCounts = topModules.map(m => {
            const total = automationData[m].total || 0;
            const automated = automationData[m].automated || 0;
            return total - automated; // Manual = Total - Automated
        });

        charts.module.data.labels = topModules;
        // First dataset: Manual Cases (green, bottom of stack) - labeled as "Total Cases" in legend
        charts.module.data.datasets[0].data = manualCounts;
        charts.module.data.datasets[0].label = 'Total Cases';
        charts.module.data.datasets[0].backgroundColor = '#10b981'; // Green for dark theme
        // Second dataset: Automated Cases (purple, top of stack)
        charts.module.data.datasets[1].data = automatedCounts;
        charts.module.data.datasets[1].label = 'Automated Case';
        charts.module.data.datasets[1].backgroundColor = '#a855f7'; // Purple for dark theme
    } else {
        charts.module.data.labels = ['No Data Available'];
        charts.module.data.datasets[0].data = [0];
        charts.module.data.datasets[1].data = [0];
    }
    charts.module.update('none');


    // Update modules table with detailed metrics (disabled - table removed)
    // updateModulesTable(smokeTests, regressionTests);

    // Populate test tables
    populateSmokeTestTable(smokeTests);
    populateRegressionTestTable(regressionTests);
}

// Combine module data from both test types
function combineModuleData(smoke, regression) {
    const combined = {};

    Object.keys(smoke || {}).forEach(key => {
        combined[key] = (combined[key] || 0) + smoke[key];
    });

    Object.keys(regression || {}).forEach(key => {
        combined[key] = (combined[key] || 0) + regression[key];
    });

    return combined;
}

// Combine automation data from both test types
function combineAutomationData(smoke, regression) {
    const combined = {};

    Object.keys(smoke || {}).forEach(key => {
        if (!combined[key]) {
            combined[key] = { total: 0, automated: 0, manual: 0 };
        }
        combined[key].total += smoke[key].total || 0;
        combined[key].automated += smoke[key].automated || 0;
        combined[key].manual += smoke[key].manual || 0;
    });

    Object.keys(regression || {}).forEach(key => {
        if (!combined[key]) {
            combined[key] = { total: 0, automated: 0, manual: 0 };
        }
        combined[key].total += regression[key].total || 0;
        combined[key].automated += regression[key].automated || 0;
        combined[key].manual += regression[key].manual || 0;
    });

    return combined;
}

// Combine priority data from both test types
function combinePriorityData(smoke, regression) {
    const combined = {};

    Object.keys(smoke || {}).forEach(key => {
        combined[key] = (combined[key] || 0) + smoke[key];
    });

    Object.keys(regression || {}).forEach(key => {
        combined[key] = (combined[key] || 0) + regression[key];
    });

    return combined;
}

// Store modules data globally for filtering
let allModulesData = [];

// Update modules table with detailed metrics
function updateModulesTable(smokeTests, regressionTests) {
    console.log('updateModulesTable called');
    const tbody = document.getElementById('modulesTable');

    if (!tbody) {
        console.error('Table body element #modulesTable not found!');
        return;
    }

    if (!smokeTests && !regressionTests) {
        console.log('No test data provided');
        tbody.innerHTML = '<tr><td colspan="9" class="loading-message">No test data available</td></tr>';
        return;
    }

    console.log('Processing smoke tests:', smokeTests);
    console.log('Processing regression tests:', regressionTests);

    // Process modules separately for Smoke and Regression
    const modulesArray = [];

    // Process smoke tests modules
    const smokeAutomation = smokeTests.automationByModule || {};
    console.log('Smoke automation data:', smokeAutomation);
    Object.keys(smokeAutomation).forEach(module => {
        if (module && module.trim() !== '' && module.toLowerCase() !== 'other') {
            const moduleData = smokeAutomation[module];
            const totalTCs = moduleData.total || 0;
            const automated = moduleData.automated || 0;
            const manual = moduleData.manual || 0;
            const automatable = totalTCs || (automated + manual);
            
            const overallPercent = totalTCs > 0 
                ? Math.round((automated / totalTCs) * 100) 
                : 0;
            
            const effectivePercent = automatable > 0
                ? Math.round((automated / automatable) * 100)
                : overallPercent;

            // Determine status
            let statusText = 'In Progress';
            let statusClass = 'in-progress';
            
            if (effectivePercent >= 100) {
                statusText = 'Complete';
                statusClass = 'complete';
            } else if (effectivePercent >= 90) {
                statusText = 'Near Complete';
                statusClass = 'near-complete';
            } else if (effectivePercent >= 80) {
                statusText = 'Excellent Progress';
                statusClass = 'excellent';
            } else if (effectivePercent >= 60) {
                statusText = 'Good Progress';
                statusClass = 'good';
            } else if (effectivePercent >= 40) {
                statusText = 'In Progress';
                statusClass = 'in-progress';
            } else {
                statusText = 'Getting Started';
                statusClass = 'getting-started';
            }

            modulesArray.push({
                testType: 'Smoke Test',
                name: module,
                totalTCs,
                manual,
                automated,
                automatable,
                overallPercent,
                effectivePercent,
                statusText,
                statusClass
            });
        }
    });

    // Process regression tests modules
    const regressionAutomation = regressionTests.automationByModule || {};
    Object.keys(regressionAutomation).forEach(module => {
        if (module && module.trim() !== '' && module.toLowerCase() !== 'other') {
            const moduleData = regressionAutomation[module];
            const totalTCs = moduleData.total || 0;
            const automated = moduleData.automated || 0;
            const manual = (moduleData.manual !== undefined) ? moduleData.manual : (totalTCs - automated);
            const automatable = totalTCs || (automated + manual);
            
            const overallPercent = totalTCs > 0 
                ? Math.round((automated / totalTCs) * 100) 
                : 0;
            
            const effectivePercent = automatable > 0
                ? Math.round((automated / automatable) * 100)
                : overallPercent;

            // Determine status
            let statusText = 'In Progress';
            let statusClass = 'in-progress';
            
            if (effectivePercent >= 100) {
                statusText = 'Complete';
                statusClass = 'complete';
            } else if (effectivePercent >= 90) {
                statusText = 'Near Complete';
                statusClass = 'near-complete';
            } else if (effectivePercent >= 80) {
                statusText = 'Excellent Progress';
                statusClass = 'excellent';
            } else if (effectivePercent >= 60) {
                statusText = 'Good Progress';
                statusClass = 'good';
            } else if (effectivePercent >= 40) {
                statusText = 'In Progress';
                statusClass = 'in-progress';
            } else {
                statusText = 'Getting Started';
                statusClass = 'getting-started';
            }

            modulesArray.push({
                testType: 'Regression Test',
                name: module,
                totalTCs,
                manual,
                automated,
                automatable,
                overallPercent,
                effectivePercent,
                statusText,
                statusClass
            });
        }
    });

    // Store globally for filtering
    allModulesData = modulesArray;

    // Render table immediately - no delays to prevent glitching
    if (!tbody) {
        console.error('Table body element not found!');
        return;
    }

    console.log('Updating modules table with', modulesArray.length, 'modules');

    if (allModulesData.length > 0) {
        // Render immediately without flag (simplified)
        renderTableRows(tbody, allModulesData);
    } else {
        tbody.innerHTML = '<tr><td colspan="9" class="loading-message">No module data available</td></tr>';
    }

    // Initialize filters only once
    if (!window.filtersInitialized) {
        setTimeout(() => {
            initFilters(false);
            window.filtersInitialized = true;
        }, 500);
    }
}

// Render table rows directly (simplified)
function renderTableRows(tbody, modulesArray) {
    if (!tbody || !modulesArray || modulesArray.length === 0) {
        console.log('renderTableRows: No data to render');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" class="loading-message">No data available</td></tr>';
        }
        return;
    }

    console.log('renderTableRows: Rendering', modulesArray.length, 'modules');

    // Sort by effective percentage (descending)
    const sortedData = [...modulesArray].sort((a, b) => b.effectivePercent - a.effectivePercent);

    // Build HTML string
    const tableHTML = sortedData.map(module => {
        const progressBarColor = module.effectivePercent >= 80 ? '#10b981' :
                                 module.effectivePercent >= 60 ? '#14b8a6' :
                                 module.effectivePercent >= 40 ? '#f59e0b' : '#ef4444';

        const showProgressText = module.effectivePercent >= 15;

        return `
            <tr>
                <td class="test-type-cell">
                    <span class="test-type-badge ${module.testType === 'Smoke Test' ? 'smoke' : 'regression'}">${module.testType}</span>
                </td>
                <td class="module-name">
                    <strong>${module.name}</strong>
                </td>
                <td class="metric-cell">
                    ${module.totalTCs}
                    ${module.automatable < module.totalTCs ? `<span class="sub-note">(${module.automatable} automatable)</span>` : ''}
                </td>
                <td class="metric-cell">${module.manual}</td>
                <td class="metric-cell">${module.automated}</td>
                <td class="metric-cell">${module.overallPercent}%</td>
                <td class="metric-cell highlight">${module.effectivePercent}%</td>
                <td class="progress-cell">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${module.effectivePercent}%; background: ${progressBarColor};">
                            ${showProgressText ? `<span class="progress-text">${module.effectivePercent}%</span>` : ''}
                        </div>
                        ${!showProgressText ? `<span class="progress-text-outside">${module.effectivePercent}%</span>` : ''}
                    </div>
                </td>
                <td>
                    <span class="status-pill ${module.statusClass}">${module.statusText}</span>
                </td>
            </tr>
        `;
    }).join('');

    // Update DOM once
    tbody.innerHTML = tableHTML;
    console.log('renderTableRows: Table rendered successfully');
}


// Apply filters and render table
function applyFiltersAndRender() {
    const tbody = document.getElementById('modulesTable');

    if (!tbody) {
        console.warn('Modules table tbody not found');
        return;
    }

    if (!allModulesData || allModulesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading-message">No module data available</td></tr>';
        return;
    }
    
    const filters = getFilters();
    
    // Filter data
    let filteredData = allModulesData.filter(module => {
        // Test Type filter
        if (filters.testType && !module.testType.toLowerCase().includes(filters.testType.toLowerCase())) {
            return false;
        }
        
        // Module Name filter
        if (filters.moduleName && !module.name.toLowerCase().includes(filters.moduleName.toLowerCase())) {
            return false;
        }
        
        // Total TCs filter
        if (filters.totalTCs) {
            const filterValue = filters.totalTCs.toLowerCase();
            if (filterValue.includes('>')) {
                const num = parseInt(filterValue.replace('>', '').trim());
                if (module.totalTCs <= num) return false;
            } else if (filterValue.includes('<')) {
                const num = parseInt(filterValue.replace('<', '').trim());
                if (module.totalTCs >= num) return false;
            } else {
                const num = parseInt(filterValue);
                if (module.totalTCs !== num) return false;
            }
        }
        
        // Manual filter
        if (filters.manual) {
            const filterValue = filters.manual.toLowerCase();
            if (filterValue.includes('>')) {
                const num = parseInt(filterValue.replace('>', '').trim());
                if (module.manual <= num) return false;
            } else if (filterValue.includes('<')) {
                const num = parseInt(filterValue.replace('<', '').trim());
                if (module.manual >= num) return false;
            } else {
                const num = parseInt(filterValue);
                if (module.manual !== num) return false;
            }
        }
        
        // Automated filter
        if (filters.automated) {
            const filterValue = filters.automated.toLowerCase();
            if (filterValue.includes('>')) {
                const num = parseInt(filterValue.replace('>', '').trim());
                if (module.automated <= num) return false;
            } else if (filterValue.includes('<')) {
                const num = parseInt(filterValue.replace('<', '').trim());
                if (module.automated >= num) return false;
            } else {
                const num = parseInt(filterValue);
                if (module.automated !== num) return false;
            }
        }
        
        // Overall % filter
        if (filters.overallPercent) {
            const filterValue = filters.overallPercent.toLowerCase();
            if (filterValue.includes('>')) {
                const num = parseInt(filterValue.replace('>', '').trim());
                if (module.overallPercent <= num) return false;
            } else if (filterValue.includes('<')) {
                const num = parseInt(filterValue.replace('<', '').trim());
                if (module.overallPercent >= num) return false;
            } else {
                const num = parseInt(filterValue);
                if (module.overallPercent !== num) return false;
            }
        }
        
        // Effective % filter
        if (filters.effectivePercent) {
            const filterValue = filters.effectivePercent.toLowerCase();
            if (filterValue.includes('>')) {
                const num = parseInt(filterValue.replace('>', '').trim());
                if (module.effectivePercent <= num) return false;
            } else if (filterValue.includes('<')) {
                const num = parseInt(filterValue.replace('<', '').trim());
                if (module.effectivePercent >= num) return false;
            } else {
                const num = parseInt(filterValue);
                if (module.effectivePercent !== num) return false;
            }
        }
        
        // Status filter
        if (filters.status && !module.statusText.toLowerCase().includes(filters.status.toLowerCase())) {
            return false;
        }
        
        return true;
    });

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading-message">No data matches the filters</td></tr>';
        return;
    }

    // Use shared render function
    renderTableRows(tbody, filteredData);
}

// Old renderTableDirectly - now uses renderTableRows
function renderTableDirectly(modulesArray) {
    const tbody = document.getElementById('modulesTable');
    if (tbody) {
        renderTableRows(tbody, modulesArray);
    }
}

// Legacy function - kept for compatibility
function renderTableRowsOld(tbody, modulesArray) {
    if (!tbody || !modulesArray || modulesArray.length === 0) {
        return;
    }
    
    const sortedData = [...modulesArray].sort((a, b) => b.effectivePercent - a.effectivePercent);

    tbody.innerHTML = sortedData.map(module => {
        const progressBarColor = module.effectivePercent >= 80 ? '#10b981' :
                                 module.effectivePercent >= 60 ? '#14b8a6' :
                                 module.effectivePercent >= 40 ? '#f59e0b' : '#ef4444';

        const showProgressText = module.effectivePercent >= 15;

        return `
            <tr>
                <td class="test-type-cell">
                    <span class="test-type-badge ${module.testType === 'Smoke Test' ? 'smoke' : 'regression'}">${module.testType}</span>
                </td>
                <td class="module-name">
                    <strong>${module.name}</strong>
                </td>
                <td class="metric-cell">
                    ${module.totalTCs}
                    ${module.automatable < module.totalTCs ? `<span class="sub-note">(${module.automatable} automatable)</span>` : ''}
                </td>
                <td class="metric-cell">${module.manual}</td>
                <td class="metric-cell">${module.automated}</td>
                <td class="metric-cell">${module.overallPercent}%</td>
                <td class="metric-cell highlight">${module.effectivePercent}%</td>
                <td class="progress-cell">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${module.effectivePercent}%; background: ${progressBarColor};">
                            ${showProgressText ? `<span class="progress-text">${module.effectivePercent}%</span>` : ''}
                        </div>
                        ${!showProgressText ? `<span class="progress-text-outside">${module.effectivePercent}%</span>` : ''}
                    </div>
                </td>
                <td>
                    <span class="status-pill ${module.statusClass}">${module.statusText}</span>
                </td>
            </tr>
        `;
    }).join('');
}

// Get filters from inputs and localStorage
function getFilters() {
    const filters = {};
    const filterInputs = document.querySelectorAll('.column-filter');
    
    filterInputs.forEach(input => {
        const column = input.dataset.column;
        const savedValue = localStorage.getItem(`filter_${column}`);
        const currentValue = input.value || savedValue || '';
        filters[column] = currentValue;
        if (currentValue) {
            input.value = currentValue;
        }
    });
    
    return filters;
}

// Save filters to localStorage
function saveFilters() {
    const filterInputs = document.querySelectorAll('.column-filter');
    filterInputs.forEach(input => {
        const column = input.dataset.column;
        localStorage.setItem(`filter_${column}`, input.value);
    });
}

// Initialize filter event listeners (only once)
function initFilters(applySavedFilters = true) {
    const filterInputs = document.querySelectorAll('.column-filter');
    
    if (filterInputs.length === 0) {
        // Table not ready yet, try again once
        if (!window.filterRetryAttempted) {
            window.filterRetryAttempted = true;
            setTimeout(() => initFilters(applySavedFilters), 300);
        }
        return;
    }
    
    // Debounce function to prevent rapid re-renders
    let filterTimeout;
    const debouncedApplyFilters = () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            saveFilters();
            applyFiltersAndRender();
        }, 400);
    };
    
    // Load saved filters and set up event listeners
    filterInputs.forEach(input => {
        // Load saved filter value
        const savedValue = localStorage.getItem(`filter_${input.dataset.column}`);
        if (savedValue) {
            input.value = savedValue;
        }
        
        // Remove any existing listeners by cloning
        const newInput = input.cloneNode(true);
        if (savedValue) {
            newInput.value = savedValue;
        }
        input.parentNode.replaceChild(newInput, input);
        
        // Add debounced event listener
        newInput.addEventListener('input', debouncedApplyFilters);
        
        newInput.addEventListener('focus', function() {
            this.style.background = 'var(--card-bg)';
        });
    });
    
    // Apply saved filters on initial load only if requested
    if (applySavedFilters) {
        const filters = getFilters();
        const hasFilters = Object.values(filters).some(v => v && v.trim() !== '');
        if (hasFilters) {
            setTimeout(() => {
                applyFiltersAndRender();
            }, 600);
        }
    }
}

// Update last refresh time
function updateLastRefreshTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdated').textContent = timeString;
}

// Show/hide loading state
function showLoading(isLoading) {
    const refreshBtn = document.getElementById('refreshBtn');
    if (isLoading) {
        refreshBtn.disabled = true;
        refreshBtn.style.opacity = '0.6';
    } else {
        refreshBtn.disabled = false;
        refreshBtn.style.opacity = '1';
    }
}

// Show error message
function showError(message) {
    console.error(message);
    
    // Create or update error banner
    let errorBanner = document.getElementById('errorBanner');
    if (!errorBanner) {
        errorBanner = document.createElement('div');
        errorBanner.id = 'errorBanner';
        errorBanner.className = 'error-banner';
        document.querySelector('.container').insertBefore(errorBanner, document.querySelector('.header'));
    }
    errorBanner.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-text">${message}</span>
        </div>
    `;
    errorBanner.style.display = 'block';
}

// Hide error message
function hideErrorMessage() {
    const errorBanner = document.getElementById('errorBanner');
    if (errorBanner) {
        errorBanner.style.display = 'none';
    }
}

// Show empty state when no data
function showEmptyState() {
    const tbody = document.getElementById('recentTestsTable');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-message">No data available. Please check your Google Sheets configuration.</td></tr>';
    }
}

// Table data storage
let smokeTableData = [];
let regressionTableData = [];

// Populate Smoke Test Table
function populateSmokeTestTable(data) {
    if (!data || !data.automationByModule) {
        document.getElementById('smokeTestBody').innerHTML = '<tr><td colspan="6" class="loading-cell">No data available</td></tr>';
        return;
    }

    smokeTableData = [];
    const tbody = document.getElementById('smokeTestBody');
    
    Object.keys(data.automationByModule).forEach(feature => {
        const moduleData = data.automationByModule[feature];
        moduleData.testCases.forEach(testCase => {
            smokeTableData.push({
                feature: feature,
                testCase: testCase.name,
                manual: testCase.manual,
                automated: testCase.automated,
                automationPercent: testCase.automated > 0 ? ((testCase.automated / (testCase.manual + testCase.automated)) * 100).toFixed(0) : 0,
                status: testCase.status.toLowerCase()
            });
        });
    });

    renderSmokeTable(smokeTableData);
}

// Render Smoke Test Table
function renderSmokeTable(data) {
    const tbody = document.getElementById('smokeTestBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No results found</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${row.feature}</td>
            <td>${row.testCase}</td>
            <td>${row.manual}</td>
            <td>${row.automated}</td>
            <td>${row.automationPercent}%</td>
            <td><span class="status-badge ${row.status.replace(/ /g, '-')}">${row.status}</span></td>
        </tr>
    `).join('');
}

// Populate Regression Test Table
function populateRegressionTestTable(data) {
    regressionTableData = [];

    // Get the raw data from API
    fetch('/api/regression-tests')
        .then(response => response.json())
        .then(apiData => {
            if (apiData && apiData.success && apiData.data) {
                // Parse the data array (each row is an array of values)
                regressionTableData = apiData.data
                    .filter(row => row[0] && row[0].trim() !== '' && row[0] !== 'Total Use cases') // Filter out empty rows and total row
                    .map(row => {
                        const story = row[0] || '';
                        const totalCases = parseInt(row[1]) || 0;
                        const priority = row[2] || 'N/A';
                        const automatedCases = parseInt(row[3]) || 0;
                        const status = row[5] || 'Not Started';

                        return {
                            story: story,
                            totalCases: totalCases,
                            priority: priority,
                            automatedCases: automatedCases,
                            automationPercent: totalCases > 0 ? ((automatedCases / totalCases) * 100).toFixed(0) : 0,
                            status: status.toLowerCase()
                        };
                    });

                renderRegressionTable(regressionTableData);
            } else {
                document.getElementById('regressionTestBody').innerHTML = '<tr><td colspan="6" class="loading-cell">No data available</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error fetching regression data:', error);
            document.getElementById('regressionTestBody').innerHTML = '<tr><td colspan="6" class="loading-cell">Error loading data</td></tr>';
        });
}

// Render Regression Test Table
function renderRegressionTable(data) {
    const tbody = document.getElementById('regressionTestBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No results found</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${row.story}</td>
            <td>${row.totalCases}</td>
            <td><span class="priority-badge ${row.priority}">${row.priority}</span></td>
            <td>${row.automatedCases}</td>
            <td>${row.automationPercent}%</td>
            <td><span class="status-badge ${row.status.replace(/ /g, '-')}">${row.status}</span></td>
        </tr>
    `).join('');
}

// Filter Smoke Test Table
function filterSmokeTable() {
    const searchTerm = document.getElementById('smokeSearchInput').value.toLowerCase();
    const statusFilter = document.getElementById('smokeStatusFilter').value;

    const filtered = smokeTableData.filter(row => {
        const matchesSearch = row.feature.toLowerCase().includes(searchTerm) || 
                            row.testCase.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    renderSmokeTable(filtered);
}

// Filter Regression Test Table
function filterRegressionTable() {
    const searchTerm = document.getElementById('regressionSearchInput').value.toLowerCase();
    const statusFilter = document.getElementById('regressionStatusFilter').value;
    const priorityFilter = document.getElementById('regressionPriorityFilter').value;

    const filtered = regressionTableData.filter(row => {
        const matchesSearch = row.story.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || row.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
    });

    renderRegressionTable(filtered);
}

// Add event listeners for filters
document.addEventListener('DOMContentLoaded', function() {
    const smokeSearchInput = document.getElementById('smokeSearchInput');
    const smokeStatusFilter = document.getElementById('smokeStatusFilter');
    const regressionSearchInput = document.getElementById('regressionSearchInput');
    const regressionStatusFilter = document.getElementById('regressionStatusFilter');
    const regressionPriorityFilter = document.getElementById('regressionPriorityFilter');

    if (smokeSearchInput) smokeSearchInput.addEventListener('input', filterSmokeTable);
    if (smokeStatusFilter) smokeStatusFilter.addEventListener('change', filterSmokeTable);
    if (regressionSearchInput) regressionSearchInput.addEventListener('input', filterRegressionTable);
    if (regressionStatusFilter) regressionStatusFilter.addEventListener('change', filterRegressionTable);
    if (regressionPriorityFilter) regressionPriorityFilter.addEventListener('change', filterRegressionTable);
});
