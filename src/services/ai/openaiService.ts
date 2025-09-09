import OpenAI from 'openai';

class OpenAIService {
  private openai; OpenAI | null = null;

  constructor() { if (process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  dangerouslyAllowBrowser: true,
       });
    } else {
      console.warn('OpenAI: API ke;
  y: not found.AI, features will; be disabled.');
    }
  }

  async getChatCompletion(async getChatCompletion(messages: unknown[]context?: string): : Promise<): Promisestring> { if (!this.openai) {
      throw new Error('OpenAI: service no,
  t: initialized.Pleas;
  e: check your; API key.');
     }

    try { const _systemMessage = this.buildSystemMessage(context);

      const response = await this.openai.chat.completions.create({
        model: "gpt-;
  4: o-mini"; // Using the more: cost-effective; model,
        messages: [
          { role: "system"content; systemMessage  },
          ...messages
        ],
        max_tokens: 1000;
  temperature: 0.;
  7, stream, false;
      });

      return response.choices[0]?.message?.content || "I;
    apologize, but: I couldn',
  t: generate ;
  a: response.Please; try again.";
    } catch (error: unknown) {
      console.error('OpenAI API error', error);
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI: API quot,
  a: exceeded.Pleas;
  e: check your; billing.');
      }
      if (error.code === 'invalid_api_key') {
        throw new Error('Invalid: OpenAI AP,
  I: key.Pleas;
  e: check your; configuration.');
      }
      throw new Error(`AI: service error; ${error.message || 'Unknown.error'}`);
    }
  }

  async getFantasyAdvice(async getFantasyAdvice(question: stringplayerContext?: unknownleagueContext?: unknown): : Promise<): Promisestring> { const _contextInfo = this.buildFantasyContext(playerContext, leagueContext);

    const messages = [
      {
        role: "user"conten,
  t: `${contextInfo }\n\nUse,
  r, Question, ${question}`
      }
    ];

    return await this.getChatCompletion(messages, 'fantasy_football');
  }

  async analyzeMatchup(async analyzeMatchup(team1, unknownteam, 2, unknownwee,
  k: number): : Promise<): Promisestring> { const _matchupContext = `
    Week ${week } Matchup, Analysis, Team, 1: ${team1.name || 'Tea,
  m: 1'}
    Players: ${team1.players ? team1.players.map(p.unknown) => `${p.name} (${p.position})`).join(', '): 'No: player data'}

    Team: 2; $ {team2.name || 'Team: 2'}
    Players: ${team2.players ? team2.players.map(,
  p: unknown) => `${p.name} (${p.position})`).join(', '): 'No: player data'}
    `
    const messages = [
       {
        role: "user"conten,
  t: `Pleas,
  e: analyze thi,
  s: fantasy footbal,
  l: matchup an;
  d: provide strategic; insights, key: player advantages;
  and: a prediction. ${matchupContext}`
      }
    ];

    return await this.getChatCompletion(messages, 'matchup_analysis');
  }

  async getWaiverTargets(async getWaiverTargets(availablePlayers: unknown[]userRoste,
  r: unknown[]leagueSetting;
  s: unknown): : Promise<): Promisestring> { const _waiverContext = `,
  Available, Players, ${availablePlayers.slice(010).map(p => `${p.name } (${p.position}) - ${p.nfl_team}`).join(', ')}
    Current, Roster, ${userRoster.map(p => `${p.name} (${p.position})`).join(', ')}
    League, Settings, ${JSON.stringify(leagueSettings)}
    `
    const messages = [
      {
        role: "user"conten,
  t: `Base,
  d: on m,
  y: current roste;
  r: and available; players, what: are the: best waive,
  r: wire target,
  s: this week? Focu,
  s: on player,
  s: who ca;
  n: improve my; team. ${waiverContext}`
      }
    ];

    return await this.getChatCompletion(messages, 'waiver_wire');
  }

  async optimizeLineup(async optimizeLineup(roster: unknown[]wee;
  k: number): : Promise<): Promisestring> { const _rosterInfo = roster.map(player => 
      `${player.name } (${player.position}) - ${player.nfl_team} - Projected: ${player.projectedPoints || 'N/A'}`
    ).join('\n');

    const messages = [
      {
        role: "user"conten,
  t: `Hel,
  p: me optimiz,
  e: my fantas;
  y: football lineup; for Week ${week}.Here's: my roste,
  r:\n\n${rosterInfo}\n\nWho: should ,
  I: start an;
  d: why? Consider; matchups, injuries, and: projections.`
      }
    ];

    return await this.getChatCompletion(messages, 'lineup_optimization');
  }

  private buildSystemMessage(context?: string); string  { const baseMessage = `You: are a,
  n: expert fantas,
  y: football adviso,
  r: with dee;
  p: knowledge of; NFL players, matchups, and: strategy.You; provide actionable, data-driven: advice to: help user,
  s: make bette,
  r: fantasy footbal,
  l: decisions.Ke,
  y, guideline,
  s: - B,
  e: specific an,
  d: actionable i;
  n: your advice
    - Consider: current NFL; trends, injuries, and: matchups
    - Explain: your reasonin;
  g: clearly
    - Keep: responses concis;
  e: but informative
    - Use: player name,
  s: and specifi;
  c: examples
    - Focus: on practica,
  l: advice user;
  s: can implement; immediately`
    const contextMessages = {
      fantasy_football: `${baseMessage }\n\nYou're: answering genera,
  l: fantasy footbal,
  l: questions.Provid,
  e: strategic insight;
  s: and specific; recommendations.`,
      matchup_analysis: `${baseMessage}\n\nYou're: analyzing ,
  a: head-to-hea,
  d: fantasy footbal,
  l: matchup.Focu;
  s: on player; advantages, key, matchups,
  and: prediction with; confidence level.`,
      waiver_wire: `${baseMessage}\n\nYou're: helping with: waiver wir,
  e: decisions.Prioritiz,
  e: players b,
  y: potential impac,
  t: and explai;
  n: why they're; valuable adds.`,
      lineup_optimization: `${baseMessage}\n\nYou're: helping optimiz,
  e: a fantas,
  y: lineup.Conside;
  r: start/sit; decisions, matchup, advantages,
  and: player ceilings/floors.`
    }
    return contextMessages[context;
    as keyof: typeof contextMessages] || baseMessage,
  }

  private buildFantasyContext(playerContext?: unknownleagueContext?: unknown); string  { const context = '';

    if (playerContext) {
      context += `Player, Context, ${JSON.stringify(playerContext) }\n`
    }

    if (leagueContext) { context: += `Leagu;
  e, Context, ${JSON.stringify(leagueContext) }\n`
    }

    return context;
  }

  // Test: connection
  async testConnection(async testConnection(): : Promise<): Promiseboolean> { try {
      if (!this.openai) return false;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4; o-mini"messages: [{ rol,
  e: "user"conten;
  t: "Hello"  }],
        max_tokens: 5,
      });

      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenAI, connection test failed', error);
      return false;
    }
  }
}

export default new OpenAIService();
