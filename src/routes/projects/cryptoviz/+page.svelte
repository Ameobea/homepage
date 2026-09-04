<script lang="ts">
  import PageLayout from '$lib/components/PageLayout.svelte';
  import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';

  let { data } = $props();
</script>

<PageLayout
  title="Cryptoviz"
  description="Cryptoviz - a live web-based depth-of-market visualization for cryptocurrency markets"
>
  <div class="root">
    <center>
      <h2>Cryptoviz</h2>
    </center>
    <ResponsiveImage
      entry={data.images['cryptoviz/cryptoviz.png']}
      alt="A screenshot of the Cryptoviz visualization showing price activity in the Ethereum market on Poloniex"
      style="margin-bottom: 40px"
    />
    <h2 style="padding-top: 28px">Overview</h2>
    <p>
      In financial markets with buyers and sellers, there's something called an <i>Order Book</i>
      which contains the number of units of all pending offers to buy and sell assets at every price
      level. This order book can be in many ways, but most only show the state of the book at a
      single point in time.
    </p>
    <p>
      Cryptoviz allows users to visualize the state of the orderbook as it changes, recording the
      behavior of market participants and making their effects on the orderbook visible.
    </p>

    <center>
      <iframe
        width="100%"
        style="height: 50vh"
        src="https://www.youtube-nocookie.com/embed/H5JtKzw37rA"
        title="Cryptoviz demo video"
        frameborder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </center>

    <h2 style="padding-top: 24px">Technical Info</h2>
    <p>
      Cryptoviz was built using the Canvas2D API along with a library called
      <a href="http://paperjs.org/" target="_blank" rel="noopener noreferrer">PaperJS</a>. The red
      and blue lines and circles along with the lines and axis labels were drawn with PaperJS, while
      the white lines in the background were drawn using the Canvas2D API directly.
    </p>
    <p>
      For the data used to power the visualization, a direct WebSocket feed is opened to the
      Poloniex exchange's orderbook update feed. To start, these updates are recorded in an array
      and not applied to the visualization. Once that happens, a HTTP request is made to their
      public REST API to fetch the current state of the orderbook. The response from that contains a
      sequence number which can be used to pick the exact point at which to start applying orderbook
      updates; all recorded updates before the sequence number of the orderbook snapshot are
      discarded, and the ones after are applied.
    </p>
    <p>
      By following this procedure, a virtual orderbook is maintained matching the state of the
      actual orderbook on the exchange. Some extra logic is added to try to handle WebSocket feed
      disconnections, preventing messages from being applied out-of-order. Book modifications and
      trades are plotted on the canvas until it reaches the right side, at which point the entire
      history is re-rendered with a smaller zoom. The same thing is used when users manually zoom in
      by selecting a region with the mouse: A subsection of the history is rendered from left to
      right and composited on the canvas. Since the visualization always grows to the right, there
      is no need to re-render the entire thing every update; instead, new data can be added
      directly.
    </p>

    <h2 style="padding-top: 24px">Results + Interesting Observations</h2>
    <p>
      I wasn't 100% sure what kind of results to expect when building this tool. I had been
      interested in financial markets and in particular the way in which automated strategies
      contribute to market activity, and Cryptoviz makes these kinds of behaviors very clear. As it
      turned out, Cryptoviz was great at both visually analyzing activity that was difficult of
      impossible to see otherwise such as algorithmic trading patterns as well as analyzing the
      impact of large-scale market events.
    </p>
    <p>
      I created a Twitter account (
      <a href="https://twitter.com/cryptoviznet" target="_blank" rel="noopener noreferrer"
        >@cryptoviznet</a
      >) to showcase interested market events captured with Cryptoviz. Here are some of the images I
      posted there:
    </p>

    <div class="image-rows">
      <div class="image-row">
        <ResponsiveImage
          entry={data.images['cryptoviz/algo1.jpg']}
          alt="Screenshot of Cryptoviz showing clearly automated ask order activity over ~13 minutes"
        />
        <center class="caption">
          Evenly placed descending sell orders over a 13-minute timeframe
        </center>
      </div>
      <div class="image-row">
        <ResponsiveImage
          entry={data.images['cryptoviz/algo2.jpg']}
          alt="A screenshot of the Cryptoviz interface showing ascending buy offers one-up each other to remain at the top of the book over a very short timeframe"
        />
        <center class="caption">
          Ascending buy offers one-up each other to remain at the top of the book over a very short
          timeframe
        </center>
      </div>
      <div class="image-row">
        <ResponsiveImage
          entry={data.images['cryptoviz/market_evt1.png']}
          alt="A screenshot of the Cryptoviz interface showing a large market event where a long-standing buy wall was broken by an extremely large sell order"
        />
        <center class="caption">
          A large market event where a long-standing buy wall was broken all at once by an extremely
          large sell order
        </center>
      </div>
    </div>

    <p>
      All in all, I see Cryptoviz as one of my most interesting and successful projects. Although
      based on tools that already existed for the stock market, I feel that I created something
      genuinely useful and did so effectively. Data visualization is something I've always enjoyed,
      and getting to do so in such a unique was was a great experience. Many things I learned while
      building it have been useful for other projects, and the process introduced me to a lot of new
      ideas.
    </p>
  </div>
</PageLayout>

<style>
  .root {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  .image-rows {
    display: flex;
    flex: 1;
    flex-direction: column;
    background-color: rgba(16, 16, 16, 0.32);
    padding: 2px;
    margin-bottom: 20px;
  }

  .image-row {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 10px;
  }

  .caption {
    color: #aaa;
    font-style: italic;
    font-size: 14px;
  }
</style>
