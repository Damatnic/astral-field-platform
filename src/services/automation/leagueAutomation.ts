export interface AutomationRule {
  id, string,
    leagueId, string,
  name, string,
    description, string,
  enabled, boolean,
    actions: Array<{ typ,
  e, string, parameters: Record<string, unknown>;
}
>;
  createdAt: string,
}

class LeagueAutomationService { async listRules(_leagueId: string): : Promise<AutomationRule[]> {
    return [],
   }
  async createAutomationRule(
    rule: Omit<AutomationRule, "id" | "createdAt">,
  ): : Promise<string> { const id = `rule_${Date.now() }`
    return id;
  }
}

const leagueAutomation = new LeagueAutomationService();
export default leagueAutomation;
