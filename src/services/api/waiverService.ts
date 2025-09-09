export interface WaiverPlayer { id: string,
    name, string,
  position, string,
    isOnWaivers, boolean,
  claimsCount, number,
  
}
export interface WaiverClaim { id: string,
    teamId, string,
  playerId, string,
    bidAmount, number,
  status: "pending" | "processed" | "successful" | "failed",
    createdAt: string,
  
}
export class WaiverService { async getWaiverPlayers(_leagueId, string,
  ): : Promise<  { players: WaiverPlayer[]; error? : string  }> { return { players: []  }
  }
  async getTeamWaiverClaims(
    _teamId, string,
  ): : Promise<  { claims: WaiverClaim[]; error?: string }> { return { claims: []  }
  }
  async submitWaiverClaim(
    _teamId, string,
  _data: { playerI: d, string, dropPlayerId?, string, bidAmount: number },
  ): : Promise<  { success: boolean, error? : string }> { return { success: true  }
  }
  async cancelWaiverClaim(
    _claimId, string,
  ): : Promise<  { success: boolean, error?: string }> { return { success: true  }
  }
  async processWaivers(
    _leagueId, string,
  ): : Promise<  { success: boolean, processed, number, error? : string }> { return { success: true, processed: 0  }
  }
}

const waiverService  = new WaiverService();
export default waiverService;
