//! Reborn perks — 10 perks stackáveis compráveis com Reborn Points.

use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use ts_rs::TS;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
#[serde(rename_all = "snake_case")]
pub enum PerkEffect {
    /// Começa cada run com N Insight Points.
    StartIp,
    /// +N% produção por ml_steps_trained.
    NeuralMult,
    /// -N% era threshold (easier eras).
    EraDiscount,
    /// Prestige bonus compounds +N% por reborn.
    CompoundPrestige,
    /// +N tokens/s auto sem clicar.
    AutoClick,
    /// Começa com N building de cada tier 1-3.
    SecondWind,
    /// Offline efficiency 100% (fixed, não stacka).
    OfflineMaster,
    /// Revela próximo evento antes de disparar.
    Oracle,
    /// +N tokens por click.
    ClickMulti,
    /// -N% custo de buildings.
    CheaperBuildings,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
pub struct PerkDef {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub cost: u32,
    pub effect: PerkEffect,
    pub value: f64,
    pub max_stacks: Option<u32>,
    pub flavor: &'static str,
}

pub static PERKS: LazyLock<Vec<PerkDef>> = LazyLock::new(|| {
    use PerkEffect::*;
    vec![
        PerkDef {
            id: "childhood_prodigy",
            name: "Childhood Prodigy",
            description: "Começa cada run com 50 IP",
            cost: 1,
            effect: StartIp,
            value: 50.0,
            max_stacks: Some(5),
            flavor: "Você já sabia o que era softmax antes de andar.",
        },
        PerkDef {
            id: "neural_memory",
            name: "Neural Memory",
            description: "+0.5% produção por step treinado no modelo real",
            cost: 2,
            effect: NeuralMult,
            value: 0.005,
            max_stacks: Some(10),
            flavor: "Os weights do seu nano-transformer lembram de cada run.",
        },
        PerkDef {
            id: "faster_eras",
            name: "Fast Forward",
            description: "Avanço de era -20% (threshold menor)",
            cost: 3,
            effect: EraDiscount,
            value: 0.2,
            max_stacks: Some(3),
            flavor: "Você já viu esse filme. Sabe como ele acaba.",
        },
        PerkDef {
            id: "compound_prestige",
            name: "Compound Prestige",
            description: "Prestige bonus compounds +10% por reborn",
            cost: 5,
            effect: CompoundPrestige,
            value: 0.1,
            max_stacks: Some(5),
            flavor: "Cada morte te deixa mais forte.",
        },
        PerkDef {
            id: "auto_click",
            name: "Auto-Click",
            description: "+5 tokens/s permanente sem clicar",
            cost: 2,
            effect: AutoClick,
            value: 5.0,
            max_stacks: Some(10),
            flavor: "Você contratou um bot pra te fingir.",
        },
        PerkDef {
            id: "second_wind",
            name: "Second Wind",
            description: "Começa com 3 if/else bot + 2 markov",
            cost: 4,
            effect: SecondWind,
            value: 1.0,
            max_stacks: Some(1),
            flavor: "Seu ex-estagiário voltou assombrado.",
        },
        PerkDef {
            id: "offline_master",
            name: "Offline Master",
            description: "Eficiência offline 100%",
            cost: 6,
            effect: OfflineMaster,
            value: 1.0,
            max_stacks: Some(1),
            flavor: "O jogo joga tão bem quanto você. Ou melhor.",
        },
        PerkDef {
            id: "oracle",
            name: "Oracle",
            description: "Próximo evento aparece no EventLog antes",
            cost: 3,
            effect: Oracle,
            value: 1.0,
            max_stacks: Some(1),
            flavor: "Você viu esse tweet antes dele ser tweetado.",
        },
        PerkDef {
            id: "click_multi",
            name: "Caffeinated Clicks",
            description: "+10 tokens por clique",
            cost: 1,
            effect: ClickMulti,
            value: 10.0,
            max_stacks: Some(20),
            flavor: "Red Bull patrocinou.",
        },
        PerkDef {
            id: "cheaper_buildings",
            name: "Bulk Discount",
            description: "Buildings custam -15% menos",
            cost: 4,
            effect: CheaperBuildings,
            value: 0.15,
            max_stacks: Some(4),
            flavor: "Amazon Business account.",
        },
    ]
});

pub fn get(id: &str) -> Option<&'static PerkDef> {
    PERKS.iter().find(|p| p.id == id)
}

pub fn all() -> &'static [PerkDef] {
    PERKS.as_slice()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn has_ten_perks() {
        assert_eq!(all().len(), 10);
    }

    #[test]
    fn all_ids_unique() {
        let mut seen = std::collections::HashSet::new();
        for p in all() {
            assert!(seen.insert(p.id));
        }
    }
}
