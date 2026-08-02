let gridsArray = [];
let saveTimeout;
let pageCount = 1;

// Ultra-clean outbox input configuration blueprints templates strings
const componentTemplates = {
    block: `
        <div class="w-full h-full minimal-outline-box flex flex-col justify-between p-3 rounded group relative">
            <input type="text" value="Label Title" class="w-full box-header-input bg-transparent border-none focus:outline-none tracking-wide">
            <input type="text" value="" placeholder="..." class="w-full box-body-content bg-transparent border-none focus:outline-none mt-1">
            <button onclick="removeWidget(this)" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-zinc-400 hover:text-zinc-900 rounded border border-zinc-200 opacity-0 group-hover:opacity-100 text-[8px] font-bold flex items-center justify-center transition shadow-sm z-20">✕</button>
        </div>
    `,
    notes: `
        <div class="w-full h-full minimal-outline-box p-3 flex flex-col rounded group relative">
            <input type="text" value="Notes & Description" class="w-full box-header-input bg-transparent border-b border-zinc-100 focus:outline-none pb-1 mb-2">
            <textarea class="w-full flex-1 bg-transparent resize-none focus:outline-none text-xs text-zinc-600 leading-relaxed no-scrollbar" placeholder="Type info here..."></textarea>
            <button onclick="removeWidget(this)" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-zinc-400 hover:text-zinc-900 rounded border border-zinc-200 opacity-0 group-hover:opacity-100 text-[8px] font-bold flex items-center justify-center transition shadow-sm z-20">✕</button>
        </div>
    `
};

document.addEventListener('DOMContentLoaded', function() {
    // Attempt schema initialization procedures
    loadLayoutState();
});

/**
 * Instantiate an individual clean grid instance on an explicitly declared node target
 * @param {HTMLElement} element - Target grid element node pointer reference bounding
 */
function initGridInstance(element) {
    let grid = GridStack.init({
        column: 12,
        cellHeight: 40,
        margin: 6,
        acceptWidgets: true,
        dragIn: '.sidebar-item',
        dragInOptions: { revert: 'invalid', scroll: false, appendTo: 'body', helper: 'clone' },
        float: true
    }, element);

    // Capture dropped content deployments cleanly
    grid.on('added', function(event, items) {
        items.forEach(function(item) {
            const el = item.el;
            const type = el.getAttribute('data-type');
            
            if (type && componentTemplates[type]) {
                el.innerHTML = componentTemplates[type];
                el.removeAttribute('data-type'); 
                debouncedSave();
            }
        });
    });

    // Monitor positioning changes securely
    grid.on('change', debouncedSave);
    gridsArray.push(grid);
}

/**
 * Append a blank document page block stack cleanly to your workspace
 */
function addNewPage() {
    const printArea = document.getElementById('print-area');
    
    const newPageDiv = document.createElement('div');
    newPageDiv.className = 'doc-page minimal-sheet shadow-sm p-12 border border-zinc-200 relative';
    
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid-stack';
    gridDiv.setAttribute('data-page-index', pageCount);
    
    newPageDiv.appendChild(gridDiv);
    printArea.appendChild(newPageDiv);
    
    initGridInstance(gridDiv);
    pageCount++;
    debouncedSave();
}

/**
 * Debounce auto-saves to prevent drag rendering lag spikes
 */
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveLayoutState, 400);
}

function removeWidget(button) {
    const gridItem = button.closest('.grid-stack-item');
    const gridEl = gridItem.closest('.grid-stack');
    const gridInstance = gridsArray.find(g => g.el === gridEl);
    
    if (gridInstance) {
        gridInstance.removeWidget(gridItem);
        debouncedSave();
    }
}

function clearCanvas() {
    if (confirm("Completely wipe current multi-page sheet document structures?")) {
        gridsArray.forEach(grid => grid.destroy(false));
        document.getElementById('print-area').innerHTML = `
            <div class="doc-page minimal-sheet shadow-sm p-12 border border-zinc-200 relative">
                <div class="grid-stack" data-page-index="0"></div>
            </div>
        `;
        gridsArray = [];
        pageCount = 1;
        initGridInstance(document.querySelector('.grid-stack'));
        localStorage.removeItem('dnd_studio_multipage_state');
    }
}

function saveLayoutState() {
    const stateData = [];
    
    document.querySelectorAll('.grid-stack').forEach((gridEl, pageIdx) => {
        const gridInstance = gridsArray.find(g => g.el === gridEl);
        if (!gridInstance) return;

        const layout = gridInstance.save(false);
        const elementValues = [];
        
        gridEl.querySelectorAll('.grid-stack-item').forEach((item) => {
            const inputs = item.querySelectorAll('input');
            const textareas = item.querySelectorAll('textarea');
            
            elementValues.push({
                html: item.innerHTML,
                inputs: Array.from(inputs).map(i => i.value),
                textareas: Array.from(textareas).map(t => t.value)
            });
        });

        stateData.push({ pageIndex: pageIdx, layout: layout, elements: elementValues });
    });

    localStorage.setItem('dnd_studio_multipage_state', JSON.stringify(stateData));
}

function loadLayoutState() {
    const savedString = localStorage.getItem('dnd_studio_multipage_state');
    
    if (!savedString) {
        // Fallback default boot configuration paths
        initGridInstance(document.querySelector('.grid-stack'));
        return;
    }

    const stateData = JSON.parse(savedString);
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = ''; // Wipe starting placeholders
    gridsArray = [];
    pageCount = stateData.length;

    stateData.forEach((pageData, index) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'doc-page minimal-sheet shadow-sm p-12 border border-zinc-200 relative';
        
        const gridDiv = document.createElement('div');
        gridDiv.className = 'grid-stack';
        gridDiv.setAttribute('data-page-index', index);
        
        pageDiv.appendChild(gridDiv);
        printArea.appendChild(pageDiv);

        // Re-instantiate Grid elements context
        let grid = GridStack.init({
            column: 12,
            cellHeight: 40,
            margin: 6,
            acceptWidgets: true,
            dragIn: '.sidebar-item',
            dragInOptions: { revert: 'invalid', scroll: false, appendTo: 'body', helper: 'clone' },
            float: true
        }, gridDiv);

        grid.load(pageData.layout);
        gridsArray.push(grid);

        // Re-inject typed inner text data values mapping
        gridDiv.querySelectorAll('.grid-stack-item').forEach((item, itemIdx) => {
            if (pageData.elements[itemIdx]) {
                item.innerHTML = pageData.elements[itemIdx].html;
                
                const inputs = item.querySelectorAll('input');
                inputs.forEach((input, i) => {
                    if (pageData.elements[itemIdx].inputs[i] !== undefined) {
                        input.value = pageData.elements[itemIdx].inputs[i];
                    }
                });

                const textareas = item.querySelectorAll('textarea');
                textareas.forEach((textarea, t) => {
                    if (pageData.elements[itemIdx].textareas[t] !== undefined) {
                        textarea.value = pageData.elements[itemIdx].textareas[t];
                    }
                });
            }
        });

        // Attach global standard listeners tracking modifications
        grid.on('added', function(event, items) {
            items.forEach(function(item) {
                const el = item.el;
                const type = el.getAttribute('data-type');
                if (type && componentTemplates[type]) {
                    el.innerHTML = componentTemplates[type];
                    el.removeAttribute('data-type'); 
                    debouncedSave();
                }
            });
        });
        grid.on('change', debouncedSave);
    });
}

function exportToPDF() {
    const element = document.getElementById('print-area');
    
    const style = document.createElement('style');
    style.id = 'print-temporary-override';
    style.innerHTML = 'button, .ui-resizable-handle { display: none !important; } .doc-page { border: none !important; box-shadow: none !important; margin: 0 !important; page-break-after: always !important; }';
    document.head.appendChild(style);

    const opt = {
        margin:       0,
        filename:     'minimal_sheet_document.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    setTimeout(() => {
        html2pdf().set(opt).from(element).save().then(() => {
            const targetOverride = document.getElementById('print-temporary-override');
            if (targetOverride) targetOverride.remove();
        }).catch((err) => {
            console.error("PDF Generator error:", err);
            const targetOverride = document.getElementById('print-temporary-override');
            if (targetOverride) targetOverride.remove();
        });
    }, 150);
}
