import { GoogleGenAI } from "@google/genai";

// IMPORTANT: Do not hardcode the API key. It must be set as an environment variable.
// I am using process.env.API_KEY as per the instructions, ignoring the key from the prompt.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    alert("API_KEY environment variable not set. Please set it to run the application.");
    throw new Error("API key not found.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const colorPalettes = [
    { name: 'Vibrant', colors: ['#FF5733', '#33FF57', '#3357FF', '#FF33A1'] },
    { name: 'Corporate Blue', colors: ['#0D47A1', '#1976D2', '#42A5F5', '#90CAF9'] },
    { name: 'Forest Green', colors: ['#1B5E20', '#388E3C', '#66BB6A', '#A5D6A7'] },
    { name: 'Modern Tech', colors: ['#4A90E2', '#7ED321', '#F5A623', '#D0021B'] },
    { name: 'Luxury Gold', colors: ['#B8860B', '#D4AF37', '#FFD700', '#F0E68C'] },
    { name: 'Playful Pink', colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#DB7093'] },
];

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('logo-form') as HTMLFormElement;
    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    const loader = document.getElementById('loader') as HTMLDivElement;
    const logoGrid = document.getElementById('logo-grid') as HTMLDivElement;
    const paletteContainer = document.getElementById('color-palettes') as HTMLDivElement;

    const adModal = document.getElementById('ad-modal') as HTMLDivElement;
    const closeModalBtn = document.querySelector('.close-modal-btn') as HTMLButtonElement;


    // --- Initialize UI ---

    function setupPalettes() {
        paletteContainer.innerHTML = '';
        colorPalettes.forEach((palette, index) => {
            const paletteEl = document.createElement('div');
            paletteEl.className = 'palette';
            paletteEl.dataset.colors = palette.colors.join(',');
            paletteEl.setAttribute('aria-label', palette.name);
            paletteEl.setAttribute('role', 'radio');
            
            const colorsDiv = document.createElement('div');
            colorsDiv.className = 'palette-colors';
            
            palette.colors.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = color;
                colorsDiv.appendChild(swatch);
            });
            paletteEl.appendChild(colorsDiv);
            
            paletteEl.addEventListener('click', () => {
                document.querySelectorAll('.palette').forEach(p => p.classList.remove('selected'));
                paletteEl.classList.add('selected');
                paletteEl.setAttribute('aria-checked', 'true');
            });
            
            if (index === 0) {
                paletteEl.classList.add('selected');
                paletteEl.setAttribute('aria-checked', 'true');
            }

            paletteContainer.appendChild(paletteEl);
        });
    }

    setupPalettes();
    
    // --- Event Listeners ---
    form.addEventListener('submit', handleFormSubmit);
    closeModalBtn.addEventListener('click', () => adModal.classList.remove('visible'));
    adModal.addEventListener('click', (e) => {
        if (e.target === adModal) {
            adModal.classList.remove('visible');
        }
    });

    // --- Core Logic ---
    async function handleFormSubmit(event: Event) {
        event.preventDefault();
        
        const formData = new FormData(form);
        const description = formData.get('description') as string;
        const industry = formData.get('industry') as string;
        const style = formData.get('style') as string;
        const selectedPalette = document.querySelector('.palette.selected') as HTMLDivElement;
        const paletteName = selectedPalette.getAttribute('aria-label') || 'vibrant';

        if (!description) {
            alert('Please fill out the brand description.');
            return;
        }

        toggleLoading(true);

        try {
            // Updated prompt to be more descriptive and natural for the image model.
            // Using the palette name is more effective than a list of hex codes.
            const prompt = `A professional logo for a "${industry}" company. The brand identity is "${description}". Style: ${style}. Use a color scheme inspired by a "${paletteName}" color palette. The logo should be a clean, modern, vector-style graphic on a solid white background. It must be an icon or abstract mark, with no text.`;
            
            const response = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: prompt,
                config: {
                  numberOfImages: 4,
                  outputMimeType: 'image/png',
                  aspectRatio: '1:1',
                },
            });
            
            // Filter the response to ensure we only try to display valid images,
            // preventing broken image icons if a generation fails.
            const validImages = response.generatedImages
                .map(img => img?.image?.imageBytes)
                .filter((bytes): bytes is string => !!bytes);

            displayLogos(validImages);

        } catch (error) {
            console.error("Error generating images:", error);
            alert("Sorry, we couldn't generate your logos. Please try again later.");
        } finally {
            toggleLoading(false);
        }
    }

    function toggleLoading(isLoading: boolean) {
        if (isLoading) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = 'Generating...';
            loader.style.display = 'block';
            logoGrid.style.display = 'none'; // Hide grid while loading
            logoGrid.innerHTML = '';
        } else {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
                Generate Your Free Logo`;
            loader.style.display = 'none';
            logoGrid.style.display = 'grid'; // Show grid again
        }
    }

    function displayLogos(base64Images: string[]) {
        logoGrid.innerHTML = '';
        if (base64Images.length === 0) {
            logoGrid.innerHTML = `<p style="grid-column: 1 / -1;">No logos were generated. Try adjusting your prompt or try again.</p>`;
            return;
        }
        base64Images.forEach((base64Image, i) => {
            const card = createLogoCard(base64Image, i);
            logoGrid.appendChild(card);
        });
    }

    function createLogoCard(base64Image: string, index: number): HTMLElement {
        const imageUrl = `data:image/png;base64,${base64Image}`;
        const card = document.createElement('div');
        card.className = 'logo-card';

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'logo-image-wrapper';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Generated Logo ${index + 1}`;
        img.loading = 'lazy';

        // Add overlay for screenshot protection
        const protector = document.createElement('div');
        protector.className = 'screenshot-protector';
        
        imageWrapper.append(img, protector);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = 'Download';
        downloadBtn.dataset.clicks = '0';
        downloadBtn.addEventListener('click', () => handleDownloadClick(downloadBtn, imageUrl, `logo-${index + 1}.png`));
        
        card.append(imageWrapper, downloadBtn);
        return card;
    }

    function handleDownloadClick(button: HTMLButtonElement, imageUrl: string, fileName: string) {
        let clicks = parseInt(button.dataset.clicks || '0', 10);

        if (clicks === 0) {
            // First click: show ad
            adModal.classList.add('visible');
            button.dataset.clicks = '1';
            button.textContent = 'Download Now';
        } else {
            // Second click: download image
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Reset button state
            button.dataset.clicks = '0';
            button.textContent = 'Download';
            adModal.classList.remove('visible');
        }
    }
});