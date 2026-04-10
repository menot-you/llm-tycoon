//! Permanent upgrades — 6 stackáveis, compráveis com Insight Points, persistem
//! através de prestiges mas são resetados num reborn.

use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use ts_rs::TS;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
#[serde(rename_all = "snake_case")]
pub enum PermanentEffect {
    StartTokens,
    /// Multiplicador base de produção (compound entre stacks).
    ProductionMult,
    /// +N% eficiência offline.
    OfflineEfficiency,
    /// -N crescimento base de alucinação.
    HallucinationBase,
    /// -N% custo de upgrades.
    CheaperUpgrades,
    /// Reservado (começa com 1 building de um tipo).
    StartingBuilding,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
pub struct PermanentUpgradeDef {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub cost: u32,
    pub effect: PermanentEffect,
    pub value: f64,
    pub max_stacks: Option<u32>,
    pub flavor: &'static str,
}

pub static PERMANENTS: LazyLock<Vec<PermanentUpgradeDef>> = LazyLock::new(|| {
    use PermanentEffect::*;
    vec![
        PermanentUpgradeDef {
            id: "hindsight",
            name: "Hindsight Bias",
            description: "Começa cada run com 100 tokens",
            cost: 1,
            effect: StartTokens,
            value: 100.0,
            max_stacks: Some(10),
            flavor: "Você lembra como resolver isso. Só não sabe como.",
        },
        PermanentUpgradeDef {
            id: "transfer_learning",
            name: "Transfer Learning",
            description: "+10% produção base",
            cost: 3,
            effect: ProductionMult,
            value: 1.1,
            max_stacks: Some(20),
            flavor: "Weights anteriores ecoam pelos latent spaces.",
        },
        PermanentUpgradeDef {
            id: "scaling_laws",
            name: "Scaling Laws",
            description: "+5% eficiência offline",
            cost: 5,
            effect: OfflineEfficiency,
            value: 0.05,
            max_stacks: Some(6),
            flavor: "Quanto mais parâmetros, melhor. Provavelmente.",
        },
        PermanentUpgradeDef {
            id: "better_benchmarks",
            name: "Better Benchmarks",
            description: "-10% crescimento de alucinação",
            cost: 8,
            effect: HallucinationBase,
            value: 0.1,
            max_stacks: Some(5),
            flavor: "Se você mede, você controla. Ou inventa.",
        },
        PermanentUpgradeDef {
            id: "vc_connections",
            name: "VC Connections",
            description: "-20% custo de upgrades",
            cost: 10,
            effect: CheaperUpgrades,
            value: 0.2,
            max_stacks: Some(3),
            flavor: "Andreessen atende seu DM.",
        },
        PermanentUpgradeDef {
            id: "recursive_improve",
            name: "Recursive Self-Improvement",
            description: "+50% produção base (raro)",
            cost: 50,
            effect: ProductionMult,
            value: 1.5,
            max_stacks: Some(3),
            flavor: "O modelo treina o modelo que treina você.",
        },
    ]
});

pub fn get(id: &str) -> Option<&'static PermanentUpgradeDef> {
    PERMANENTS.iter().find(|p| p.id == id)
}

pub fn all() -> &'static [PermanentUpgradeDef] {
    PERMANENTS.as_slice()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn has_six_permanents() {
        assert_eq!(all().len(), 6);
    }

    #[test]
    fn all_ids_unique() {
        let mut seen = std::collections::HashSet::new();
        for p in all() {
            assert!(seen.insert(p.id));
        }
    }
}
