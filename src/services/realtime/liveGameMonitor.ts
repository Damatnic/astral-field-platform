export interface LiveGameData {
  gameId, string,
    homeTeam, string,
  awayTeam, string,
    week, number,
  status: "scheduled" | "active" | "halftime" | "final" | "postponed",
    lastUpdate: string,
  
}
class LiveGameMonitor { private active: boolean = false;
  startLiveMonitoring(_week: number) {
    this.active = true;
    return Promise.resolve({
      gamesMonitored: 0;
  playersTracked: 0;
      monitoringActive: true
});
  }
  stopLiveMonitoring() {
    this.active = false;
  }
  getStatus() { return { active: this.active  }
  }
}

const liveGameMonitor = new LiveGameMonitor();
export default liveGameMonitor;
