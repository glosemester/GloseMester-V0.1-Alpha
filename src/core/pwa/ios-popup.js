/* ============================================
   IOS-POPUP.JS - GloseMester v2.6
   iOS installation instructions popup
   ============================================ */

/**
 * Create iOS installation instructions popup
 * @returns {HTMLElement} - Popup element
 */
export function createIOSPopup() {
    const popup = document.createElement('div');
    popup.id = 'ios-install-popup';
    popup.className = 'popup-overlay';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 12000;
        animation: fadeIn 0.3s;
    `;

    popup.innerHTML = `
        <div class="popup-content" style="
            background: white;
            max-width: 350px;
            width: 90%;
            padding: 30px;
            border-radius: var(--radius-lg, 30px);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
            text-align: left;
            position: relative;
            animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
            <!-- Header -->
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            ">
                <h3 style="margin: 0; font-size: 22px; font-weight: 700;">
                    📲 Installer på iPhone
                </h3>
                <button
                    class="close-ios-popup"
                    aria-label="Lukk"
                    style="
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: #999;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.background='#f0f0f0'; this.style.color='#333';"
                    onmouseout="this.style.background='none'; this.style.color='#999';"
                >&times;</button>
            </div>

            <!-- Description -->
            <p style="
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 20px;
                color: #666;
            ">
                Apple tillater ikke automatisk installasjon.
                Følg disse enkle trinnene for å legge til appen på hjemskjermen:
            </p>

            <!-- Instructions -->
            <div style="
                background: #f5f5f7;
                padding: 20px;
                border-radius: var(--radius-md, 20px);
                font-size: 14px;
                margin-bottom: 20px;
            ">
                <!-- Step 1 -->
                <div style="
                    margin-bottom: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                ">
                    <span style="
                        font-size: 24px;
                        line-height: 1;
                        flex-shrink: 0;
                    ">1️⃣</span>
                    <div>
                        <strong style="display: block; margin-bottom: 4px;">
                            Trykk på Del-knappen
                        </strong>
                        <span style="font-size: 12px; color: #666;">
                            (Ikon nederst eller øverst i Safari - ser ut som en firkant med pil oppover)
                        </span>
                    </div>
                </div>

                <!-- Step 2 -->
                <div style="
                    margin-bottom: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                ">
                    <span style="
                        font-size: 24px;
                        line-height: 1;
                        flex-shrink: 0;
                    ">2️⃣</span>
                    <div>
                        <strong style="display: block; margin-bottom: 4px;">
                            Scroll ned og velg
                        </strong>
                        <span style="
                            display: inline-block;
                            background: white;
                            padding: 4px 8px;
                            border-radius: 6px;
                            font-weight: 600;
                            margin-top: 4px;
                        ">
                            "Legg til på Hjem-skjerm" ➕
                        </span>
                    </div>
                </div>

                <!-- Step 3 -->
                <div style="
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                ">
                    <span style="
                        font-size: 24px;
                        line-height: 1;
                        flex-shrink: 0;
                    ">3️⃣</span>
                    <div>
                        <strong style="display: block; margin-bottom: 4px;">
                            Trykk "Legg til"
                        </strong>
                        <span style="font-size: 12px; color: #666;">
                            (Blå knapp oppe til høyre)
                        </span>
                    </div>
                </div>
            </div>

            <!-- Success message -->
            <div style="
                background: rgba(255, 107, 71, 0.1);
                padding: 12px;
                border-radius: var(--radius-md, 20px);
                margin-bottom: 20px;
                font-size: 13px;
                color: var(--color-primary, #FF6B47);
                text-align: center;
            ">
                ✨ Appen vil nå ligge på hjemskjermen din!
            </div>

            <!-- Close button -->
            <button
                class="btn btn-primary close-ios-popup"
                style="
                    width: 100%;
                    padding: 14px;
                    font-size: 16px;
                    font-weight: 600;
                    border-radius: var(--radius-md, 20px);
                    background: var(--color-primary, #FF6B47);
                    color: white;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                "
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 107, 71, 0.4)';"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
            >
                Jeg forstår 👍
            </button>
        </div>
    `;

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    // Close handlers
    const closeButtons = popup.querySelectorAll('.close-ios-popup');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            popup.style.display = 'none';
        });
    });

    // Click outside to close
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.style.display = 'none';
        }
    });

    return popup;
}

console.log('🍎 iOS Popup module loaded');
