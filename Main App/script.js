const heightOptions = {
    Smaragd: [
        '20 - 30 cm',
        '40 - 60 cm',
        '60 - 80 cm',
        '100 - 120 cm',
        '120 - 140 cm',
        '140 - 160 cm',
        '200 - 220 cm',
        '300 - 350 cm'
    ],
    Brabant: [
        '20 - 50 cm',
        '40 - 60 cm',
        '60 - 80 cm',
        '80 - 100 cm',
        '100 - 120 cm',
        '120 - 140 cm',
        '140 - 160 cm',
        '160 - 180 cm',
        '240 - 260 cm',
        '300 - 350 cm'
    ],
    Boothii: [
        '20 - 40 cm',
        '40 - 60 cm',
        '100 - 120 cm',
        '120 - 140 cm',
        '140 - 160 cm',
        '250 - 300 cm'
    ]
};

// Approximate prices per tree (these can be adjusted)
const priceRanges = {
    small: { min: 15, max: 25 },    // For heights up to 60cm
    medium: { min: 25, max: 40 },   // For heights up to 120cm
    large: { min: 40, max: 60 },    // For heights up to 180cm
    xlarge: { min: 60, max: 100 }   // For heights above 180cm
};

document.addEventListener('DOMContentLoaded', () => {
    // Get all section elements
    const lengthSection = document.getElementById('length-section');
    const speciesSection = document.getElementById('species-section');
    const heightSection = document.getElementById('height-section');
    const installationSection = document.getElementById('installation-section');
    const deliverySection = document.getElementById('delivery-section');
    
    // Get input elements
    const lengthInput = document.getElementById('hedge-length');
    const confirmLengthBtn = document.getElementById('confirm-length');
    const speciesRadios = document.querySelectorAll('input[name="species"]');
    const installationRadios = document.querySelectorAll('input[name="installation"]');
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    
    // Other elements
    const heightButtonsContainer = document.getElementById('height-buttons');
    const calculateButton = document.getElementById('calculate-button');
    const calculateBtn = document.querySelector('.calculate-btn');
    const loadingSection = document.getElementById('loading-section');
    const progressFill = document.querySelector('.progress-fill');
    const loadingDetails = document.querySelector('.loading-details');
    const resultDiv = document.getElementById('result');
    const treesNeededSpan = document.getElementById('trees-needed');
    const treesCostSpan = document.getElementById('trees-cost');
    const installationCostP = document.getElementById('installation-cost');
    const installationFeeSpan = document.getElementById('installation-fee');
    const deliveryCostP = document.getElementById('delivery-cost');
    const deliveryFeeSpan = document.getElementById('delivery-fee');
    const totalEstimateSpan = document.getElementById('total-estimate');
    const resetButton = document.getElementById('reset-btn');
    const resultHedgeLength = document.getElementById('result-hedge-length');
    const resultHedgeHeight = document.getElementById('result-hedge-height');

    // State variables
    let selectedSpecies = null;
    let selectedHeight = null;
    let installationPreference = null;
    let deliveryPreference = null;

    // Disable confirm button initially
    confirmLengthBtn.disabled = true;

    // Enable/disable confirm button based on length input
    lengthInput.addEventListener('input', () => {
        const length = parseFloat(lengthInput.value);
        confirmLengthBtn.disabled = !length || length <= 0;
    });

    // Handle length confirmation
    confirmLengthBtn.addEventListener('click', () => {
        const length = parseFloat(lengthInput.value);
        if (length && length > 0) {
            lengthInput.disabled = true;
            confirmLengthBtn.disabled = true;
            showNextSection(speciesSection);
        }
    });

    // Handle species selection
    speciesRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            selectedSpecies = radio.value;
            selectedHeight = null;
            updateHeightButtons();
            showNextSection(heightSection);
        });
    });

    // Handle height selection
    function updateHeightButtons() {
        heightButtonsContainer.innerHTML = '';
        if (!selectedSpecies) return;

        const heights = heightOptions[selectedSpecies];
        heights.forEach(height => {
            const button = document.createElement('button');
            button.textContent = height;
            button.type = 'button';
            if (height === selectedHeight) {
                button.classList.add('selected');
            }
            
            button.addEventListener('click', () => {
                const prevSelected = heightButtonsContainer.querySelector('.selected');
                if (prevSelected) {
                    prevSelected.classList.remove('selected');
                }
                button.classList.add('selected');
                selectedHeight = height;
                showNextSection(installationSection);
            });
            heightButtonsContainer.appendChild(button);
        });
    }

    // Handle installation selection
    installationRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            installationPreference = radio.value;
            showNextSection(deliverySection);
        });
    });

    // Handle delivery selection
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            deliveryPreference = radio.value;
            showNextSection(calculateButton);
        });
    });

    // Helper function to show next section
    function showNextSection(section) {
        section.classList.remove('hidden');
        // Use setTimeout to ensure the fade-in animation triggers after the display change
        setTimeout(() => {
            section.classList.add('fade-in');
            // Smooth scroll to the new section with custom scroll behavior
            const offset = 20; // Add some padding above the section
            const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - offset;
            
            // Custom smooth scroll function for more control
            const startPosition = window.pageYOffset;
            const distance = sectionTop - startPosition;
            const duration = 1000; // Increased duration to 1 second
            let start = null;

            function animation(currentTime) {
                if (start === null) start = currentTime;
                const timeElapsed = currentTime - start;
                const progress = Math.min(timeElapsed / duration, 1);
                
                // Easing function for smoother animation
                const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                
                window.scrollTo(0, startPosition + distance * ease(progress));
                
                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                }
            }
            
            requestAnimationFrame(animation);
        }, 50);
    }

    // Perform calculation
    async function performCalculation() {
        calculateButton.classList.add('hidden');
        resultDiv.classList.add('hidden');
        resultDiv.classList.remove('visible');
        loadingSection.classList.remove('hidden');
        
        // Ensure progress bar starts at 0
        progressFill.style.transition = 'none';
        progressFill.style.width = '0%';
        
        // Force reflow to ensure the transition is reset
        void progressFill.offsetWidth;
        
        // Re-enable transitions for smooth progress updates
        progressFill.style.transition = 'width 1s ease-in-out';

        // Define calculation steps
        const steps = [
            { progress: 20, message: "Analyzing hedge length and spacing requirements...", duration: 2000 },
            { progress: 40, message: "Calculating number of trees needed...", duration: 2000 },
            { progress: 60, message: "Determining base costs for selected species and height...", duration: 2000 },
            { progress: 80, message: "Calculating installation and delivery fees...", duration: 2000 },
            { progress: 100, message: "Finalizing your estimate...", duration: 2000 }
        ];

        // Process each step with smooth transitions
        let currentProgress = 0;
        for (const step of steps) {
            // Smoothly animate from current progress to step progress
            updateLoadingProgress(step.progress, step.message);
            currentProgress = step.progress;
            await new Promise(resolve => setTimeout(resolve, step.duration));
        }

        // Hide loading and show results
        setTimeout(() => {
            loadingSection.classList.add('hidden');
            resultDiv.classList.remove('hidden');
            setTimeout(() => {
                resultDiv.classList.add('visible');
                // Smooth scroll to results with custom scroll behavior
                const offset = 20;
                const resultTop = resultDiv.getBoundingClientRect().top + window.pageYOffset - offset;
                
                // Custom smooth scroll function for results
                const startPosition = window.pageYOffset;
                const distance = resultTop - startPosition;
                const duration = 1000; // 1 second duration
                let start = null;

                function animation(currentTime) {
                    if (start === null) start = currentTime;
                    const timeElapsed = currentTime - start;
                    const progress = Math.min(timeElapsed / duration, 1);
                    
                    // Easing function for smoother animation
                    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                    
                    window.scrollTo(0, startPosition + distance * ease(progress));
                    
                    if (timeElapsed < duration) {
                        requestAnimationFrame(animation);
                    }
                }
                
                requestAnimationFrame(animation);
            }, 50);
            calculateResults();
        }, 1000);
    }

    function updateLoadingProgress(progress, message) {
        // Ensure smooth transition of progress bar
        progressFill.style.width = `${progress}%`;
        
        if (message) {
            loadingDetails.style.opacity = '0';
            setTimeout(() => {
                loadingDetails.textContent = message;
                loadingDetails.style.opacity = '1';
            }, 200);
        }
    }

    function calculateResults() {
        const length = parseFloat(lengthInput.value);
        
        // Display hedge details
        // updateHedgeDetails(length);
        
        // Calculate trees and costs
        const treesNeeded = calculateTreesNeeded(length);
        const { minTreesCost, maxTreesCost } = calculateTreeCosts(treesNeeded);
        const installationFee = calculateInstallationFee(treesNeeded);
        const deliveryFee = calculateDeliveryFee(treesNeeded);
        
        // Calculate total costs
        const { minTotalCost, maxTotalCost } = calculateTotalCosts(
            minTreesCost, 
            maxTreesCost, 
            installationFee, 
            deliveryFee
        );

        // Update the display
        updateResultsDisplay({
            hedgeLength: length,
            selectedHeight: selectedHeight,
            treesNeeded: treesNeeded,
            minCost: minTreesCost,
            maxCost: maxTreesCost,
            installationCost: installationFee,
            deliveryCost: deliveryFee,
            totalMinCost: minTotalCost,
            totalMaxCost: maxTotalCost
        });
    }

    function updateResultsDisplay(results) {
        resultDiv.classList.remove('hidden');
        loadingSection.classList.add('hidden');
        
        // Update result spans
        resultHedgeLength.textContent = results.hedgeLength.toFixed(1);
        resultHedgeHeight.textContent = results.selectedHeight;
        treesNeededSpan.textContent = results.treesNeeded;
        treesCostSpan.textContent = `€${results.minCost.toFixed(2)} - €${results.maxCost.toFixed(2)}`;
        
        // Update installation cost if selected
        if (results.installationCost > 0) {
            installationCostP.classList.remove('hidden');
            installationFeeSpan.textContent = `€${results.installationCost.toFixed(2)}`;
        } else {
            installationCostP.classList.add('hidden');
        }
        
        // Update delivery cost if selected
        if (results.deliveryCost > 0) {
            deliveryCostP.classList.remove('hidden');
            deliveryFeeSpan.textContent = `€${results.deliveryCost.toFixed(2)}`;
        } else {
            deliveryCostP.classList.add('hidden');
        }
        
        // Update total estimate
        totalEstimateSpan.textContent = `€${results.totalMinCost.toFixed(2)} - €${results.totalMaxCost.toFixed(2)}`;
        
        // Show result with animation
        setTimeout(() => {
            resultDiv.classList.add('visible');
        }, 100);
    }

    function calculateTreesNeeded(length) {
        const spacing = selectedSpecies === 'Brabant' ? 0.75 : 0.60;
        return Math.ceil(length / spacing);
    }

    function calculateTreeCosts(treesNeeded) {
        const heightInCm = parseInt(selectedHeight.split('-')[1]);
        let priceRange;
        
        if (heightInCm <= 60) priceRange = priceRanges.small;
        else if (heightInCm <= 120) priceRange = priceRanges.medium;
        else if (heightInCm <= 180) priceRange = priceRanges.large;
        else priceRange = priceRanges.xlarge;

        return {
            minTreesCost: treesNeeded * priceRange.min,
            maxTreesCost: treesNeeded * priceRange.max
        };
    }

    function calculateInstallationFee(treesNeeded) {
        return installationPreference === 'yes' ? treesNeeded * 5 : 0;
    }

    function calculateDeliveryFee(treesNeeded) {
        return deliveryPreference === 'yes' ? 25 + (treesNeeded * 2) : 0;
    }

    function calculateTotalCosts(minTreesCost, maxTreesCost, installationFee, deliveryFee) {
        return {
            minTotalCost: minTreesCost + installationFee + deliveryFee,
            maxTotalCost: maxTreesCost + installationFee + deliveryFee
        };
    }

    // Event Listeners
    calculateBtn.addEventListener('click', performCalculation);

    resetButton.addEventListener('click', () => {
        // Reset all form fields
        lengthInput.value = '';
        lengthInput.disabled = false;
        confirmLengthBtn.disabled = true;
        speciesRadios.forEach(radio => radio.checked = false);
        installationRadios.forEach(radio => radio.checked = false);
        deliveryRadios.forEach(radio => radio.checked = false);
        
        // Reset state variables
        selectedSpecies = null;
        selectedHeight = null;
        installationPreference = null;
        deliveryPreference = null;
        
        // Hide all sections except length
        [speciesSection, heightSection, installationSection, deliverySection, calculateButton].forEach(section => {
            section.classList.remove('fade-in');
            section.classList.add('hidden');
        });
        
        // Hide results
        loadingSection.classList.add('hidden');
        resultDiv.classList.remove('visible');
        resultDiv.classList.add('hidden');
        
        // Reset height buttons
        updateHeightButtons();
    });
});
