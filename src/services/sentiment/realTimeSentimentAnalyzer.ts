export interface SentimentData {
  id, string,
    source, string,
  content, string,
    sentimentScore, number, // -1..1;
  timestamp: Date,
  
}
export class RealTimeSentimentAnalyzer { private isRunning = false;
  async startRealTimeMonitoring(): : Promise<void> {
    this.isRunning = true;
   }
  async stopRealTimeMonitoring(): : Promise<void> {
    this.isRunning = false;
  }
  getStatus() { return { running: this.isRunning  }
  }
}

const analyzer = new RealTimeSentimentAnalyzer();
export default analyzer;
