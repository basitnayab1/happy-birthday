// Main Application UI & Logic for Abuzar's 3D Birthday Web Experience

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize 3D Scene
    const scene3d = new window.BirthdayScene('webgl-container');
    const audio = window.birthdayAudio;

    // UI Elements
    const introScreen = document.getElementById('intro-screen');
    const btnStart = document.getElementById('btn-start-celebration');
    const btnToggleMusic = document.getElementById('btn-toggle-music');
    const eqBars = document.querySelector('.equalizer');
    const balloonCounterEl = document.getElementById('balloon-counter');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');

    // Bottom Action Buttons
    const btnBlow = document.getElementById('btn-blow-candles');
    const btnCut = document.getElementById('btn-cut-cake');
    const btnFireworks = document.getElementById('btn-fireworks');
    const btnParty = document.getElementById('btn-party-mode');
    const btnCamViews = document.getElementById('btn-cam-views');
    const btnMemories = document.getElementById('btn-memories');
    const btnLetter = document.getElementById('btn-letter');
    const btnGift = document.getElementById('btn-gift');
    const btnShare = document.getElementById('btn-share');

    // Modals
    const giftModal = document.getElementById('modal-gift');
    const memoriesModal = document.getElementById('modal-memories');
    const letterModal = document.getElementById('modal-letter');
    const shareModal = document.getElementById('modal-share');
    const camMenuModal = document.getElementById('modal-camera');

    // Toast helper
    let toastTimeout = null;
    function showToast(message, icon = '🎉') {
        if (toastTimeout) clearTimeout(toastTimeout);
        toastMsg.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        toast.classList.add('show');
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Modal helpers
    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        // Stop OrbitControls auto-rotate while viewing modal
        if (scene3d.controls) scene3d.controls.autoRotate = false;
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        if (scene3d.controls && !scene3d.isPartyMode) {
            scene3d.controls.autoRotate = true;
        }
    }

    // Setup modal close buttons and outside-click dismiss
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modal));
        }
    });

    // 2. Start Celebration (Intro Screen dismissed)
    btnStart.addEventListener('click', () => {
        introScreen.classList.add('hidden');
        // Start synthesized background music and audio context
        audio.startMusic();
        eqBars.classList.remove('paused');

        // Launch celebratory greeting fireworks
        scene3d.launchCelebrationFireworks();

        // Confetti burst
        if (window.confetti) {
            window.confetti({
                particleCount: 100,
                spread: 90,
                origin: { y: 0.5 }
            });
        }

        showToast("Happy Birthday Abuzar! Explore the 3D scene 🎂", "✨");
    });

    // 3. Audio / Music Toggle
    btnToggleMusic.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        if (isMuted) {
            eqBars.classList.add('paused');
            showToast("Music Muted", "🔇");
        } else {
            eqBars.classList.remove('paused');
            showToast("Celebration Music Playing", "🎵");
        }
    });

    // 4. Blow / Relight Candles
    btnBlow.addEventListener('click', () => {
        if (scene3d.isCandlesLit) {
            scene3d.blowCandles();
            btnBlow.querySelector('.btn-icon').textContent = '🔥';
            btnBlow.querySelector('.btn-label').textContent = 'Relight';
            showToast("Candles blown! Make a birthday wish, Abuzar! 🎂✨", "🕯️");
        } else {
            scene3d.relightCandles();
            btnBlow.querySelector('.btn-icon').textContent = '💨';
            btnBlow.querySelector('.btn-label').textContent = 'Blow Candles';
            showToast("Candles relit! Ready for more wishes 🔥", "✨");
        }
    });

    // 5. Cut the Cake
    btnCut.addEventListener('click', () => {
        if (!scene3d.isCandlesLit) {
            // Already blown or ready
        }
        showToast("Cutting the cake for Abuzar! 🍰", "🔪");
        scene3d.cutCake(() => {
            showToast("Cake Cut! Party time! 🍰🥳", "🎉");
            btnCut.querySelector('.btn-label').textContent = 'Cake Cut! 🍰';
            btnCut.style.opacity = '0.7';
        });
    });

    // 6. Launch Fireworks
    btnFireworks.addEventListener('click', () => {
        scene3d.launchCelebrationFireworks();
        if (window.confetti) {
            window.confetti({
                particleCount: 80,
                spread: 120,
                origin: { y: 0.6 }
            });
        }
        showToast("Fireworks launched in 3D sky! 🎆", "✨");
    });

    // 7. Party Mode Toggle
    btnParty.addEventListener('click', () => {
        const active = scene3d.togglePartyMode();
        if (active) {
            btnParty.classList.add('active');
            btnParty.querySelector('.btn-label').textContent = 'DJ ON 🪩';
            showToast("DJ Party Mode Activated! Let's groove! 🪩⚡", "🕺");
        } else {
            btnParty.classList.remove('active');
            btnParty.querySelector('.btn-label').textContent = 'Party Mode';
            showToast("Party Mode normal", "🎶");
        }
    });

    // 8. Camera Views Menu
    btnCamViews.addEventListener('click', () => {
        openModal(camMenuModal);
    });

    document.querySelectorAll('.cam-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            scene3d.setCameraView(view);
            closeModal(camMenuModal);
            showToast(`Camera switched to ${btn.textContent.trim()}`, "🎥");
        });
    });

    // 9. Modals triggers
    btnGift.addEventListener('click', () => openModal(giftModal));
    btnMemories.addEventListener('click', () => openModal(memoriesModal));
    btnLetter.addEventListener('click', () => openModal(letterModal));
    btnShare.addEventListener('click', () => openModal(shareModal));

    // Listen to custom 3D scene events
    window.addEventListener('balloonPopped', (e) => {
        balloonCounterEl.textContent = `🎈 ${e.detail.count} Popped`;
        showToast(`Balloon popped! (${e.detail.count}) 🎈`, "💥");
    });

    window.addEventListener('openGiftModal', () => {
        openModal(giftModal);
        showToast("Gift Box Unboxed! Claim your VIP perks 🎁", "⭐");
    });

    // 10. Custom Photo Replacement Feature
    const photoInput = document.getElementById('custom-photo-input');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    // Replace the first or clicked polaroid image
                    const activePolaroid = document.querySelector('.polaroid-card:nth-child(1) img') || document.querySelector('.polaroid-img-box img');
                    if (activePolaroid) {
                        activePolaroid.src = dataUrl;
                        try {
                            localStorage.setItem('abuzar_custom_photo', dataUrl);
                        } catch (err) {
                            console.warn("Storage quota limit reached", err);
                        }
                        showToast("Real photo updated on memory board! 📸", "✨");
                    }
                };
                reader.readAsDataURL(files[0]);
            }
        });

        // Restore saved photo from localStorage if present
        try {
            const savedPhoto = localStorage.getItem('abuzar_custom_photo');
            if (savedPhoto) {
                const pImg = document.querySelector('.polaroid-card:nth-child(1) img');
                if (pImg) pImg.src = savedPhoto;
            }
        } catch (e) {}
    }

    // 11. Copy Birthday Wish to Clipboard
    const btnCopyWish = document.getElementById('btn-copy-wish');
    if (btnCopyWish) {
        btnCopyWish.addEventListener('click', () => {
            const wishText = `🎉 Happy Birthday Abuzar! (2nd November) 🎂\nTo the best colleague & brother! May your year be filled with big career wins, zero bug headaches, endless chai breaks, and massive success!\nCheck out your 3D Birthday Room: ${window.location.href}`;
            navigator.clipboard.writeText(wishText).then(() => {
                showToast("Birthday Wish copied to clipboard! Ready to send on WhatsApp 📲", "📋");
            }).catch(() => {
                showToast("Selected text copied!", "📋");
            });
        });
    }

    // 12. Fullscreen Support
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                btnFullscreen.textContent = '⤓';
            } else {
                document.exitFullscreen().catch(() => {});
                btnFullscreen.textContent = '⛶';
            }
        });
    }

    // 13. Auto celebration sound / cheer on cake cut event
    window.addEventListener('cakeCutComplete', () => {
        if (audio) {
            audio.playChimeNote(523.25, audio.ctx.currentTime, 0.4, 0.4);
            audio.playChimeNote(659.25, audio.ctx.currentTime + 0.15, 0.4, 0.4);
            audio.playChimeNote(783.99, audio.ctx.currentTime + 0.3, 0.8, 0.5);
        }
    });
});

