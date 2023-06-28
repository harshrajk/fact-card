class FactCard extends HTMLElement {
  constructor() {
    super();
    this.url = "https://catfact.ninja/fact";
    this.key = "fact";
    this.loading = true;
    this.autoRefreshInterval = 1000; // Default refresh value 1000ms
    this.intervalTimer = null;
    this.showLoading = false;
    this.sse = false; // Server side events
    this.shadow = this.attachShadow({ mode: "open" });
    const card = this.buildCard();
    this.shadow.appendChild(card);
  }

  /**
   * Widget building function.
   * @returns HTMLElement
   */
  buildCard() {
    // Override the src prop
    if (this.hasAttribute("src")) {
      this.url = this.getAttribute("src");
    }

    // Let our component know about which `Key` to be mapped when response comes !
    if (this.hasAttribute("key")) {
      this.key = this.getAttribute("key");
    }

    // Should the loader text / UI be seen ?
    if (this.hasAttribute("show-loading")) {
      this.showLoading =
        this.getAttribute("show-loading") === "true" ? true : false;
    }

    const style = document.createElement("style");

    style.textContent = `
            .card{
                background: #fff;
                border-radius: 2px;
                display: inline-block;
                height: auto;
                margin: 1rem;
                position: relative;
                width: 300px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
                transition: all 0.3s cubic-bezier(.25,.8,.25,1);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-end;
                padding: 10px;
                border-radius: 5px;
            }
            .card:hover {
                box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
            }
            ::slotted(button), button {
                background-color: transparent;
                border: none;
                -moz-border-radius: 2px;
                -webkit-border-radius: 2px;
                border-radius: 2px;
                color: inherit;
                cursor: pointer;
                display: inline-block;
                font-family: Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                letter-spacing: 0.75px;
                line-height: 36px;
                min-width: 64px;
                padding: 0 8px;
                text-align: center;
                text-transform: uppercase;
            }

            ::slotted(button:hover), button:hover{
                background-color: rgba(158,158,158,0.2);
            }
            #fact-container{
                align-self:start;
                margin-bottom: 10px;
            }
        `;

    const div = document.createElement("div");
    const p = document.createElement("p");
    const buttonSlot = document.createElement("div");

    if (this.getAttribute("color")) {
      div.style.background = this.getAttribute("color");
    }

    p.id = "fact-container";

    div.appendChild(style);

    div.appendChild(p);
    div.className = "card";
    if (!this.hasAttribute("auto-refresh")) {
      buttonSlot.innerHTML = '<slot name="button-title"></slot>';
      buttonSlot.className = "cta-container";
      buttonSlot.onclick = (e) => this.getRemoteData();
      div.appendChild(buttonSlot);
    }
    return div;
  }

  stopAutoRefreshData() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = undefined;
    }
  }

  /**
   * Function to trigger remote request!
   */
  async getRemoteData() {
    try {
      if(this.hasAttribute('sse')){
        let sseFlag = this.getAttribute('sse') === true ? true : false;
        if(sseFlag){
            this.setUpSse()
        }
      }else {
          this.loading = true;
          this.showLoader(this.loading);
          const response = await fetch(this.url);
          const responseJson = await response.json();
          if (responseJson) {
            this.showData(responseJson);
          }
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  async setUpSse(){
    const evtSource = new EventSource(this.url, {
        withCredentials: true,
    });
    evtSource.onmessage = event => {
        console.log(event.data);
    }
  }

  showLoader(flag) {
    if (flag && this.showLoading) {
      let para = this.shadow.querySelector("#fact-container");
      para.textContent = `Loading....`;
    }
  }

  showData(data) {
    let para = this.shadow.querySelector("#fact-container");
    let text = data[this.key];
    para.textContent = text;
    this.loading = false;
  }

  connectedCallback() {
    this.getRemoteData();
    this.checkAutoRefresh();
  }

  checkAutoRefresh() {
    if (this.hasAttribute("auto-refresh")) {
      const autoRefreshFlag = this.getAttribute("auto-refresh");
      if (autoRefreshFlag === "true") {
        this.autoRefreshInterval = this.hasAttribute("refresh-interval")
          ? Number(this.getAttribute("refresh-interval"))
          : this.autoRefreshInterval;
        if (this.hasAttribute("show-stop-button")) {
          let stopButtonFlag = this.getAttribute("show-stop-button");
          if (stopButtonFlag !== "false") {
            this.renderStopButton();
          }
        }
        this.intervalTimer = setInterval(() => {
          this.getRemoteData();
        }, this.autoRefreshInterval);
      }
    }
  }

  renderStopButton() {
    const stopButton = document.createElement("button");
    stopButton.textContent = `Stop`;
    stopButton.onclick = (e) => this.stopAutoRefreshData();
    this.shadow.querySelector(".card").appendChild(stopButton);
  }
}

customElements.define("fact-card", FactCard);
