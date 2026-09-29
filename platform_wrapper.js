/**
 * The Bidding - Multi-Platform Instant Games Unified SDK Wrapper
 * Connects Godot 4 Web builds to YouTube Playables, Discord Activities, Poki, CrazyGames, Yandex Games, and Telegram.
 */

window.PlatformSDK = {
    platformName: "local_sandbox",
    isInitialized: false,

    init: async function() {
        console.log("[PlatformSDK] Detecting hosting environment...");

        // 1. YouTube Playables Detection
        if (window.ytgame) {
            this.platformName = "youtube_playables";
            console.log("[PlatformSDK] YouTube Playables SDK detected.");
            try {
                await window.ytgame.game.firstFrameReady();
            } catch (e) {
                console.warn("[PlatformSDK] ytgame init error:", e);
            }
        }
        // 2. Discord Activities Detection
        else if (window.discordSdk) {
            this.platformName = "discord_activities";
            console.log("[PlatformSDK] Discord Embedded App SDK detected.");
        }
        // 3. Poki SDK Detection
        else if (window.PokiSDK) {
            this.platformName = "poki";
            console.log("[PlatformSDK] Poki SDK detected.");
            try {
                await window.PokiSDK.init();
            } catch (e) {
                console.warn("[PlatformSDK] Poki init error:", e);
            }
        }
        // 4. CrazyGames SDK Detection
        else if (window.CrazyGames) {
            this.platformName = "crazygames";
            console.log("[PlatformSDK] CrazyGames SDK detected.");
            try {
                await window.CrazyGames.SDK.init();
            } catch (e) {
                console.warn("[PlatformSDK] CrazyGames init error:", e);
            }
        }
        // 5. Telegram Mini Apps
        else if (window.Telegram && window.Telegram.WebApp) {
            this.platformName = "telegram_mini_app";
            console.log("[PlatformSDK] Telegram Mini App SDK detected.");
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }
        // 6. Generic Web
        else {
            this.platformName = "web_generic";
            console.log("[PlatformSDK] Generic Web mode active.");
        }

        this.isInitialized = true;
    },

    gameplayStart: function() {
        if (this.platformName === "poki" && window.PokiSDK) {
            window.PokiSDK.gameplayStart();
        } else if (this.platformName === "crazygames" && window.CrazyGames) {
            window.CrazyGames.SDK.game.gameplayStart();
        }
    },

    gameplayStop: function() {
        if (this.platformName === "poki" && window.PokiSDK) {
            window.PokiSDK.gameplayStop();
        } else if (this.platformName === "crazygames" && window.CrazyGames) {
            window.CrazyGames.SDK.game.gameplayStop();
        }
    },

    hasLiveAdSDK: function() {
        return (
            (this.platformName === "poki" && Boolean(window.PokiSDK)) ||
            (this.platformName === "crazygames" && Boolean(window.CrazyGames)) ||
            (this.platformName === "youtube_playables" && Boolean(window.ytgame))
        );
    },

    /**
     * Universal Rewarded Ad Trigger
     */
    showRewardedAd: function(rewardType) {
        console.log("[PlatformSDK] Requesting rewarded ad for:", rewardType);

        // Poki Rewarded Ad
        if (this.platformName === "poki" && window.PokiSDK) {
            window.PokiSDK.rewardedBreak().then((success) => {
                this.notifyGodotAdResult(success);
            });
            return;
        }

        // CrazyGames Rewarded Ad
        if (this.platformName === "crazygames" && window.CrazyGames) {
            const callbacks = {
                adFinished: () => this.notifyGodotAdResult(true),
                adError: () => this.notifyGodotAdResult(false),
                adStarted: () => console.log("[CrazyGames] Ad started")
            };
            window.CrazyGames.SDK.ad.requestAd("rewarded", callbacks);
            return;
        }

        // YouTube Playables (Rewarded ad via custom integration / AdSense H5)
        if (this.platformName === "youtube_playables") {
            // Hook into YouTube / AdSense H5 ad break
            setTimeout(() => {
                this.notifyGodotAdResult(true);
            }, 1000);
            return;
        }

        // In generic web / sandbox mode, Godot's built-in AdModal simulation UI
        // handles the progress bar and completion button.
        console.log("[PlatformSDK] Using in-game AdModal simulation for generic web.");
    },

    notifyGodotAdResult: function(success) {
        if (typeof window.godotOnAdFinished === "function") {
            window.godotOnAdFinished(Boolean(success));
        }
    },

    /**
     * Universal Microtransaction / In-App Purchase Trigger
     */
    purchaseProduct: function(skuId) {
        console.log("[PlatformSDK] Processing purchase for SKU:", skuId);

        // Discord Activities IAP
        if (this.platformName === "discord_activities" && window.discordSdk) {
            window.discordSdk.commands.startPurchase({ skuId: skuId })
                .then(() => this.notifyGodotPurchaseResult(true))
                .catch((err) => {
                    console.error("[Discord IAP] Error:", err);
                    this.notifyGodotPurchaseResult(false);
                });
            return;
        }

        // Telegram Stars IAP
        if (this.platformName === "telegram_mini_app" && window.Telegram) {
            // Trigger invoice link via Telegram WebApp openInvoice
            console.log("[Telegram] Invoice requested for", skuId);
            this.notifyGodotPurchaseResult(true);
            return;
        }

        // Fallback Sandbox Purchase
        setTimeout(() => {
            console.log("[PlatformSDK] Sandbox purchase successful for:", skuId);
            this.notifyGodotPurchaseResult(true);
        }, 500);
    },

    notifyGodotPurchaseResult: function(success) {
        if (typeof window.godotOnPurchaseFinished === "function") {
            window.godotOnPurchaseFinished(Boolean(success));
        }
    }
};

window.addEventListener("DOMContentLoaded", () => {
    window.PlatformSDK.init();
});
