// ============================================
// HANDWRITING & APPLE PENCIL SUPPORT MODULE
// ============================================

class HandwritingManager {
    constructor(containerId, textareaId) {
        this.container = document.getElementById(containerId);
        this.textarea = document.getElementById(textareaId);
        this.canvas = null;
        this.signaturePad = null;
        this.currentColor = '#000000';
        this.currentSize = 2;
        this.savedDrawing = null;
        
        this.init();
    }
    
    init() {
        if (!this.container || !this.textarea) return;
        
        // Create handwriting UI
        const handwritingHTML = `
            <div class="handwriting-container">
                <div class="handwriting-toggle">
                    <button class="toggle-btn active" onclick="handwritingManagers['${this.container.id}'].switchMode('type')">
                        ⌨️ Type
                    </button>
                    <button class="toggle-btn" onclick="handwritingManagers['${this.container.id}'].switchMode('write')">
                        ✍️ Handwrite
                    </button>
                </div>
                
                <div class="textarea-mode active">
                    <!-- Original textarea stays here -->
                </div>
                
                <div class="canvas-mode">
                    <div class="canvas-wrapper">
                        <canvas class="handwriting-canvas" id="canvas-${this.container.id}"></canvas>
                    </div>
                    
                    <div class="canvas-controls">
                        <div class="color-picker">
                            <div class="color-btn black active" onclick="handwritingManagers['${this.container.id}'].setColor('#000000')"></div>
                            <div class="color-btn blue" onclick="handwritingManagers['${this.container.id}'].setColor('#3b82f6')"></div>
                            <div class="color-btn red" onclick="handwritingManagers['${this.container.id}'].setColor('#ef4444')"></div>
                            <div class="color-btn green" onclick="handwritingManagers['${this.container.id}'].setColor('#10b981')"></div>
                        </div>
                        
                        <div class="pen-size-picker">
                            <button class="size-btn" onclick="handwritingManagers['${this.container.id}'].setSize(1)">Fine</button>
                            <button class="size-btn active" onclick="handwritingManagers['${this.container.id}'].setSize(2)">Medium</button>
                            <button class="size-btn" onclick="handwritingManagers['${this.container.id}'].setSize(3)">Thick</button>
                        </div>
                        
                        <div class="canvas-actions">
                            <button class="btn btn-secondary btn-sm" onclick="handwritingManagers['${this.container.id}'].undo()">
                                ↩️ Undo
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="handwritingManagers['${this.container.id}'].clear()">
                                🗑️ Clear
                            </button>
                            <button class="btn btn-success btn-sm" onclick="handwritingManagers['${this.container.id}'].save()">
                                💾 Save
                            </button>
                        </div>
                    </div>
                    
                    <div class="handwriting-saved" id="saved-${this.container.id}">
                        ✅ Handwritten note saved! Switch to Type mode to see as text.
                    </div>
                </div>
            </div>
        `;
        
        // Insert before textarea
        this.textarea.insertAdjacentHTML('beforebegin', handwritingHTML);
        
        // Move textarea into textarea-mode
        const textareaMode = this.container.querySelector('.textarea-mode');
        textareaMode.appendChild(this.textarea);
        
        // Initialize canvas
        this.canvas = document.getElementById(`canvas-${this.container.id}`);
        this.initCanvas();
    }
    
    initCanvas() {
        if (!this.canvas) return;
        
        // Set canvas size
        const wrapper = this.canvas.parentElement;
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = 250;
        
        // Initialize SignaturePad
        if (typeof SignaturePad !== 'undefined') {
            this.signaturePad = new SignaturePad(this.canvas, {
                backgroundColor: 'rgb(255, 255, 255)',
                penColor: this.currentColor,
                minWidth: this.currentSize * 0.5,
                maxWidth: this.currentSize * 1.5,
                throttle: 0,
                minDistance: 0,
                velocityFilterWeight: 0.7
            });
        }
        
        // Load saved drawing if exists
        const savedKey = `handwriting_${this.container.id}`;
        const saved = localStorage.getItem(savedKey);
        if (saved) {
            this.savedDrawing = saved;
        }
    }
    
    switchMode(mode) {
        const textareaMode = this.container.querySelector('.textarea-mode');
        const canvasMode = this.container.querySelector('.canvas-mode');
        const toggleBtns = this.container.querySelectorAll('.toggle-btn');
        
        if (mode === 'type') {
            textareaMode.classList.add('active');
            canvasMode.classList.remove('active');
            toggleBtns[0].classList.add('active');
            toggleBtns[1].classList.remove('active');
            
            // If has saved drawing, show as text representation
            if (this.savedDrawing) {
                this.textarea.value = '[Handwritten Note Attached]';
            }
        } else {
            textareaMode.classList.remove('active');
            canvasMode.classList.add('active');
            toggleBtns[0].classList.remove('active');
            toggleBtns[1].classList.add('active');
            
            // Load saved drawing
            if (this.savedDrawing && this.signaturePad) {
                try {
                    this.signaturePad.fromDataURL(this.savedDrawing);
                } catch (e) {
                    console.log('Could not load saved drawing');
                }
            }
        }
    }
    
    setColor(color) {
        this.currentColor = color;
        if (this.signaturePad) {
            this.signaturePad.penColor = color;
        }
        
        // Update active button
        const colorBtns = this.container.querySelectorAll('.color-btn');
        colorBtns.forEach(btn => btn.classList.remove('active'));
        this.container.querySelector(`.color-btn[onclick*="${color}"]`).classList.add('active');
    }
    
    setSize(size) {
        this.currentSize = size;
        if (this.signaturePad) {
            this.signaturePad.minWidth = size * 0.5;
            this.signaturePad.maxWidth = size * 1.5;
        }
        
        // Update active button
        const sizeBtns = this.container.querySelectorAll('.size-btn');
        sizeBtns.forEach(btn => btn.classList.remove('active'));
        sizeBtns[size - 1].classList.add('active');
    }
    
    undo() {
        if (this.signaturePad) {
            const data = this.signaturePad.toData();
            if (data && data.length > 0) {
                data.pop();
                this.signaturePad.fromData(data);
            }
        }
    }
    
    clear() {
        if (this.signaturePad) {
            this.signaturePad.clear();
        }
        this.savedDrawing = null;
        localStorage.removeItem(`handwriting_${this.container.id}`);
        
        const savedNotice = document.getElementById(`saved-${this.container.id}`);
        if (savedNotice) savedNotice.classList.remove('show');
    }
    
    save() {
        if (this.signaturePad && !this.signaturePad.isEmpty()) {
            // Save as data URL
            this.savedDrawing = this.signaturePad.toDataURL();
            localStorage.setItem(`handwriting_${this.container.id}`, this.savedDrawing);
            
            // Show saved notice
            const savedNotice = document.getElementById(`saved-${this.container.id}`);
            if (savedNotice) {
                savedNotice.classList.add('show');
                setTimeout(() => savedNotice.classList.remove('show'), 3000);
            }
            
            // Update textarea with placeholder
            this.textarea.value = '[Handwritten Note Attached]';
        }
    }
    
    getDrawing() {
        return this.savedDrawing;
    }
    
    hasDrawing() {
        return this.savedDrawing !== null;
    }
}

// Global manager registry
window.handwritingManagers = {};

// Initialize handwriting for specific fields
function initHandwriting() {
    // Only initialize if SignaturePad is available
    if (typeof SignaturePad === 'undefined') {
        console.log('SignaturePad library not loaded yet');
        return;
    }
    
    // Initialize for key text areas
    const fields = [
        { container: 'briefSummaryContainer', textarea: 'briefSummary' },
        { container: 'operationsHighlightContainer', textarea: 'operationsHighlight' },
        { container: 'keyChallengContainer', textarea: 'keyChallenge' },
        { container: 'sheSectionContainer', textarea: 'sheSection' }
    ];
    
    fields.forEach(field => {
        const container = document.getElementById(field.container);
        if (container && document.getElementById(field.textarea)) {
            // Create container wrapper if doesn't exist
            if (!container) {
                const textarea = document.getElementById(field.textarea);
                const wrapper = document.createElement('div');
                wrapper.id = field.container;
                textarea.parentNode.insertBefore(wrapper, textarea);
                wrapper.appendChild(textarea);
            }
            
            window.handwritingManagers[field.container] = new HandwritingManager(
                field.container,
                field.textarea
            );
        }
    });
}

// Auto-initialize when DOM ready and library loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initHandwriting, 1000); // Delay to ensure SignaturePad loads
    });
} else {
    setTimeout(initHandwriting, 1000);
}
