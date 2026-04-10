//! 11 upgrades one-shot. Cada um tem efeitos tipados aplicados no ResourceManager.

use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use ts_rs::TS;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
#[serde(rename_all = "snake_case")]
pub enum UpgradeCategory {
    Infra,
    Data,
    Staff,
    Hype,
    Safety,
}

/// Tipo de efeito. Separar os tipos permite lookup O(1) no ResourceManager.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
#[serde(rename_all = "snake_case")]
pub enum EffectKind {
    TokensMult,
    ComputeMult,
    DataMult,
    HypeGain,
    HallucinationReduction,
    FundingMult,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
pub struct UpgradeEffect {
    pub kind: EffectKind,
    pub value: f64,
}

/// Recurso usado pra pagar o upgrade.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
#[serde(rename_all = "snake_case")]
pub enum CostResource {
    Tokens,
    Funding,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
pub struct UpgradeDef {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub category: UpgradeCategory,
    pub cost: f64,
    pub cost_resource: CostResource,
    pub era_required: u8,
    pub effects: Vec<UpgradeEffect>,
    pub flavor: &'static str,
}

pub static UPGRADES: LazyLock<Vec<UpgradeDef>> = LazyLock::new(|| {
    use CostResource::Tokens;
    use EffectKind::*;
    use UpgradeCategory::*;
    vec![
        UpgradeDef {
            id: "used_gpu",
            name: "Used GPU from eBay",
            description: "+50% produção de tokens",
            category: Infra,
            cost: 500.0,
            cost_resource: Tokens,
            era_required: 1,
            effects: vec![UpgradeEffect { kind: TokensMult, value: 1.5 }],
            flavor: "Cheira a mineração de crypto.",
        },
        UpgradeDef {
            id: "rtx_4090",
            name: "RTX 4090 Cluster",
            description: "+100% produção de tokens",
            category: Infra,
            cost: 5_000.0,
            cost_resource: Tokens,
            era_required: 2,
            effects: vec![UpgradeEffect { kind: TokensMult, value: 2.0 }],
            flavor: "Gaming? Não, treino de IA.",
        },
        UpgradeDef {
            id: "a100_pod",
            name: "A100 Pod",
            description: "+200% produção de tokens",
            category: Infra,
            cost: 100_000.0,
            cost_resource: Tokens,
            era_required: 3,
            effects: vec![UpgradeEffect { kind: TokensMult, value: 3.0 }],
            flavor: "A conta de luz triplicou.",
        },
        UpgradeDef {
            id: "wikipedia_scrape",
            name: "Wikipedia Scrape",
            description: "+100% qualidade de data",
            category: Data,
            cost: 2_000.0,
            cost_resource: Tokens,
            era_required: 2,
            effects: vec![UpgradeEffect { kind: DataMult, value: 2.0 }],
            flavor: "Bom para aprender capitais e datas.",
        },
        UpgradeDef {
            id: "reddit_firehose",
            name: "Reddit Firehose",
            description: "+150% data, +10% alucinação",
            category: Data,
            cost: 15_000.0,
            cost_resource: Tokens,
            era_required: 3,
            effects: vec![UpgradeEffect { kind: DataMult, value: 2.5 }],
            flavor: "Aprende sarcasmo. Às vezes.",
        },
        UpgradeDef {
            id: "intern",
            name: "Hire Intern",
            description: "+20% produção (manual)",
            category: Staff,
            cost: 1_000.0,
            cost_resource: Tokens,
            era_required: 1,
            effects: vec![UpgradeEffect { kind: TokensMult, value: 1.2 }],
            flavor: "Trabalha de graça, aprende muito.",
        },
        UpgradeDef {
            id: "ml_engineer",
            name: "ML Engineer",
            description: "+25% eficiência de treino",
            category: Staff,
            cost: 50_000.0,
            cost_resource: Tokens,
            era_required: 3,
            effects: vec![UpgradeEffect { kind: TokensMult, value: 1.25 }],
            flavor: "Cita papers no Twitter.",
        },
        UpgradeDef {
            id: "safety_researcher",
            name: "Safety Researcher",
            description: "-30% alucinações",
            category: Safety,
            cost: 75_000.0,
            cost_resource: Tokens,
            era_required: 4,
            effects: vec![UpgradeEffect { kind: HallucinationReduction, value: 0.3 }],
            flavor: "Escreve \"constitutional\" em tudo.",
        },
        UpgradeDef {
            id: "rlhf",
            name: "RLHF Pipeline",
            description: "-50% alucinações, -10% produção",
            category: Safety,
            cost: 500_000.0,
            cost_resource: Tokens,
            era_required: 5,
            effects: vec![
                UpgradeEffect { kind: HallucinationReduction, value: 0.5 },
                UpgradeEffect { kind: TokensMult, value: 0.9 },
            ],
            flavor: "Contratou 1000 Kenyans pra dizer \"ruim\" e \"bom\".",
        },
        UpgradeDef {
            id: "growth_hacker",
            name: "Growth Hacker",
            description: "+200% hype/s",
            category: Hype,
            cost: 10_000.0,
            cost_resource: Tokens,
            era_required: 2,
            effects: vec![UpgradeEffect { kind: HypeGain, value: 3.0 }],
            flavor: "Tweet é diferente de Twitter.",
        },
        UpgradeDef {
            id: "lobbyist",
            name: "Lobbyist",
            description: "+50% funding",
            category: Hype,
            cost: 250_000.0,
            cost_resource: Tokens,
            era_required: 5,
            effects: vec![UpgradeEffect { kind: FundingMult, value: 1.5 }],
            flavor: "Tem o número de vários senadores.",
        },
    ]
});

pub fn get(id: &str) -> Option<&'static UpgradeDef> {
    UPGRADES.iter().find(|u| u.id == id)
}

pub fn all() -> &'static [UpgradeDef] {
    UPGRADES.as_slice()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn has_eleven_upgrades() {
        assert_eq!(all().len(), 11);
    }

    #[test]
    fn all_ids_are_unique() {
        let mut seen = std::collections::HashSet::new();
        for u in all() {
            assert!(seen.insert(u.id), "duplicate id: {}", u.id);
        }
    }

    #[test]
    fn lookup_by_id() {
        assert!(get("used_gpu").is_some());
        assert!(get("does_not_exist").is_none());
    }
}
