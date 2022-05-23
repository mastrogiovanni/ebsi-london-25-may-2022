<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    let size = 0;
    let interval: NodeJS.Timeout;
    let text = ".";

    function update() {
        text = text + ".";
        if (text.length > 4) {
            text = ".";
        }
    }

    onMount(() => {
        interval = setInterval(update, 100);
    })

    onDestroy(() => {
        clearInterval(interval);
    })
</script>
{text}