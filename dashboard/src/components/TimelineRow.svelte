
<script lang="ts">
    export let time: string = "";
    export let date: string = "";
    export let title: string = "";
</script>

<div class="timeline-row">
    <div class="timeline-time">{time}<small>{date}</small>
    </div>
    <div class="timeline-dot fb-bg" />
    <div class="timeline-content">
        <i class="fa fa-map-marker" />
        <h4>{title}</h4>
        <slot></slot>
        <div class="">
            <span class="badge badge-light">Design</span>
            <span class="badge badge-light">Admin</span>
        </div>
    </div>
</div>
