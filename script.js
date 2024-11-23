document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const form = document.getElementById('candidate-form');
    const submitButton = document.querySelector('.submit-button');
    const loader = document.getElementById('loader');

    const branchModal = document.getElementById('branch-modal');
    const collegeModal = document.getElementById('college-modal');

    const branchButton = document.getElementById('branch-button');
    const collegeButton = document.getElementById('college-button');

    const closeBranchModal = document.getElementById('close-branch-modal');
    const closeCollegeModal = document.getElementById('close-college-modal');

    const confirmBranchesButton = document.getElementById('confirm-branches');
    const confirmCollegeStatusButton = document.getElementById('confirm-college-status');

    let selectedBranches = [];
    let selectedCollegeStatus = [];
    let filteredData;  // Variable to hold filtered data for PDF download

    // Open Desired Branches modal
    branchButton.addEventListener('click', () => {
        branchModal.style.display = 'block';
    });

    // Open College Status modal
    collegeButton.addEventListener('click', () => {
        collegeModal.style.display = 'block';
    });

    // Close Desired Branches modal
    closeBranchModal.addEventListener('click', () => {
        branchModal.style.display = 'none';
    });

    // Close College Status modal
    closeCollegeModal.addEventListener('click', () => {
        collegeModal.style.display = 'none';
    });

    // Confirm Desired Branches selection
    confirmBranchesButton.addEventListener('click', () => {
        selectedBranches = Array.from(branchModal.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        branchModal.style.display = 'none';
    });

    // Confirm College Status selection
    confirmCollegeStatusButton.addEventListener('click', () => {
        selectedCollegeStatus = Array.from(collegeModal.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        collegeModal.style.display = 'none';
    });

    // Fetch and display colleges in a modal
    document.getElementById('check-colleges').addEventListener('click', fetchColleges);

    function fetchColleges() {
        fetch('/get-colleges')
            .then(response => response.json())
            .then(data => {
                const collegeTableBody = document.getElementById('colleges-body');
                collegeTableBody.innerHTML = ''; // Clear existing rows

                data.colleges.forEach(college => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${college.College}</td>
                        <td>${college.Branch}</td>
                        <td>${college["GOPENS MH-CET Percentage"]}</td>
                        <td>${college.Status}</td>
                    `;
                    collegeTableBody.appendChild(row);
                });

                $('#colleges-table').DataTable(); // Initialize DataTable
            })
            .catch(error => {
                console.error('Error fetching colleges:', error);
            });
    }

    // Submit the form
    submitButton.addEventListener('click', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        selectedBranches.forEach(branch => formData.append('desired-branches', branch));
        selectedCollegeStatus.forEach(status => formData.append('college-status', status));

        const errors = [];
        if (!formData.get('student-name')) errors.push('Student Name is required');
        if (!formData.get('gender')) errors.push('Gender is required');
        if (!formData.get('category')) errors.push('Category is required');
        if (!formData.get('mh-cet-percentage')) errors.push('MH CET Percentage is required');
        if (selectedBranches.length === 0) errors.push('At least one Desired Branch is required');
        if (selectedCollegeStatus.length === 0) errors.push('At least one College Status is required');

        if (errors.length) {
            alert(errors.join('\n'));
            return;
        }

        // Show loading spinner
        loader.style.display = 'block';

        // Handle form submission to the server
        fetch('/submit', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                loader.style.display = 'none';

                if (data.error) {
                    alert(data.error);
                } else {
                    // Store filtered data for PDF download
                    filteredData = data.filtered_data;

                    // Clear the form
                    document.body.innerHTML = '';

                    // Create a new div for the results
                    const resultDiv = document.createElement('div');
                    resultDiv.innerHTML = `
                        <div class="container mt-5" id="print-table">
                            <h2 class="text-center">College Search Results</h2>
                            <div class="table-responsive" id="results-table">
                                ${data.tables}
                            </div>
                        </div>
                        <div class="text-center mt-4" id="btn-gr">
                                <button id="download-pdf" class="btn btn-success custom-button">Download PDF</button>
                                <a href="/" class="btn btn-primary custom-button">Go Back</a>
                        </div>
                    `;
                    document.body.appendChild(resultDiv);

                    // Add event listener for download PDF after the results are displayed
                    document.getElementById('download-pdf').addEventListener('click', downloadPDF);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                loader.style.display = 'none';  // Hide loader on error
                alert('An error occurred: ' + error.message);
            });
    });

    function downloadPDF() {
        // Show loader (optional)
        loader.style.display = 'block';

        // Select the entire results table to convert to PDF
        const element = document.getElementById('print-table'); // Ensure this contains the full table

        // Define pdf options
        const opt = {
            margin: 0.5, // Margin in inches
            filename: 'college_search_results.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 }, // Scale for better quality
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Use html2pdf to create the PDF
        html2pdf()
            .set(opt)
            .from(element) // Pass the entire element containing the table
            .save()
            .then(() => {
                loader.style.display = 'none'; // Hide loader after download
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                alert('Error generating PDF: ' + error.message);
                loader.style.display = 'none'; // Hide loader on error
            });
    }


});
