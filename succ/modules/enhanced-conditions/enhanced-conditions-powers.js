import { Sidekick } from "../sidekick.js";
import { EnhancedConditionsAPIDialogs } from "./enhanced-conditions-api-dialogs.js";
import { EnhancedConditionsAPI } from "./enhanced-conditions-api.js";

/**
 * Builds a mapping between status icons and journal entries that represent conditions
 */
export class EnhancedConditionsPowers {


    /**
     * Adds a boost or lower trait effect to an actor
     * @param {Actor} actor  Actor to apply the effect to
     * @param {Object} condition  The condition being applied (should be either boost or lower trait)
     * @param {boolean} boost True if this is a boost, false if it's a lower
     */
    static async boostLowerTrait(actor, condition, boost) {
        let effect = actor.effects.find(function (e) {
            return ((e.name === game.i18n.localize(condition.name)))
        });
        
        let type = boost ? "boost" : "lower";
        let result = await EnhancedConditionsAPIDialogs.boostLowerTraitDialog(actor, type);

        if (!result) {
            await EnhancedConditionsAPI.removeCondition(condition.id, actor, {warn: true});
            return;
        }

        await EnhancedConditionsPowers.boostLowerBuilder(effect, actor, result.trait, type, result.degree);
    }

    /**
     * Creates and applies the active effects for a boost or lower trait condition
     * @param {Object} effect  The active effect being updated
     * @param {Actor} actor  Actor to update
     * @param {String} trait  The trait being affected
     * @param {String} type  Specifies if this a boost or lower
     * @param {String} degree  Specifies if this a success or a raise
     */
    static async boostLowerBuilder(effect, actor, trait, type, degree) {
        let keyPath;
        let valueMod;
        let traitName;

        if (trait === "agility" ||
            trait === "smarts" ||
            trait === "spirit" ||
            trait === "strength" ||
            trait === "vigor" ) {                
            //Setting values:
            keyPath = `system.attributes.${trait}.die.sides`;
            if (type === "lower") { valueMod = degree === "raise" ? -4 : -2 }
            else { valueMod = degree === "raise" ? 4 : 2 } //System now handles going over d12 or under d4.
            traitName = Sidekick.getLocalizedAttributeName(trait);
        } else {
            //Getting the skill:
            let skill = actor.items.find(s => s.id === trait);
            if (!skill) {
                //We didn't find it by id so maybe this is the trait name
                skill = actor.items.find(s => s.name.toLowerCase() === trait.toLowerCase());
            }
            keyPath = `@Skill{${skill.name}}[system.die.sides]`
            if (type === "lower") { valueMod = degree === "raise" ? -4 : -2 }
            else { valueMod = degree === "raise" ? 4 : 2 } //System now handles going over d12 or under d4.
            traitName = skill.name;
        }    
        
        let change = [];
        change.push({ key: keyPath, mode: 2, priority: undefined, value: valueMod });

        //Foundry rejects identical objects -> You need to toObject() the effect then change the result of that then pass that over
        //It loses .data in the middle because toObject() is just the cleaned up datalet updates = effect.toObject();
        let updates = effect.toObject();
        updates.changes = change;
        updates.name += " (" + traitName + ")";
        await effect.update(updates);
    }

    // static async smite(actor, condition) {
    /**
     * Adds a smite effect to an actor
     * @param {Actor} actor  Actor to apply the effect to
     * @param {Object} condition  The condition being applied (should be smite)
     */
    static async smite(actor, condition) {
        //Get the active effect from the actor
        let effect = actor.effects.find(function (e) {
            return ((e.name === game.i18n.localize(condition.name)));
        });

        let result = await EnhancedConditionsAPIDialogs.smiteDialog(actor);

        if (!result) {
            await EnhancedConditionsAPI.removeCondition(condition.id, actor, { warn: true });
            return;
        }

        await EnhancedConditionsPowers.smiteBuilder(effect, result.weapon, result.bonus);
    }

    /**
     * Creates and applies the active effects for a smite condition
     * @param {Object} effect  The active effect being updated
     * @param {String} weaponName  The name of the weapon being affected
     * @param {String} damageBonus  The damage bonus
     */
    static async smiteBuilder(effect, weaponName, damageBonus) {
        let change = { key: `@Weapon{${weaponName}}[system.actions.dmgMod]`, mode: 2, priority: undefined, value: damageBonus };

        //Foundry rejects identical objects -> You need to toObject() the effect then change the result of that then pass that over
        //It loses .data in the middle because toObject() is just the cleaned up datalet updates = effect.toObject();
        let updates = effect.toObject();
        updates.changes = [change];
        updates.name += " (" + weaponName + ")";
        await effect.update(updates);
    }

    /**
     * Adds a protection effect to an actor
     * @param {Actor} actor  Actor to apply the effect to
     * @param {Object} condition  The condition being applied (should be protection)
     */
    static async protection(actor, condition) {
        //Get the active effect from the actor
        let effect = actor.effects.find(function (e) {
            return ((e.name === game.i18n.localize(condition.name)))
        });

        let result = await EnhancedConditionsAPIDialogs.protectionDialog();

        if (!result) {
            await EnhancedConditionsAPI.removeCondition(condition.id, actor, {warn: true});
            return;
        }

        await EnhancedConditionsPowers.protectionBuilder(effect, result.bonus, result.type);
    }

    /**
     * Creates and applies the active effects for a protection condition
     * @param {Object} effect  The active effect being updated
     * @param {String} protectionBonus  The amount to apply
     * @param {String} type  Whether this is affected toughness or armor
     */
    static async protectionBuilder(effect, protectionBonus, type) {
        let index = type === "armor" ? 1 : 0; //Toughness is stored in index 0 of the changes array and armor is in 1
        //Foundry rejects identical objects -> You need to toObject() the effect then change the result of that then pass that over
        //It loses .data in the middle because toObject() is just the cleaned up data
        let updates = effect.toObject().changes;
        updates[index].value = protectionBonus;
        await effect.update({ "changes": updates })
    }

    /**
     * Adds a deflection effect to an actor
     * @param {Actor} actor  Actor to apply the effect to
     * @param {Object} condition  The condition being applied (should be deflection)
     */
    static async deflection(actor, condition) {
        //Get the active effect from the actor
        let effect = actor.effects.find(function (e) {
            return ((e.name === game.i18n.localize(condition.name)))
        });

        let result = await EnhancedConditionsAPIDialogs.deflectionDialog();

        if (!result) {
            await EnhancedConditionsAPI.removeCondition(condition.id, actor, {warn: true});
            return;
        }

        await EnhancedConditionsPowers.deflectionBuilder(effect, result.type);
    }

    /**
     * Creates and applies the active effects for a protection condition
     * @param {Object} effect  The active effect being updated
     * @param {String} type  Whether this applies to melee, ranged, or both
     */
    static async deflectionBuilder(effect, type) {
        //Foundry rejects identical objects -> You need to toObject() the effect then change the result of that then pass that over
        //It loses .data in the middle because toObject() is just the cleaned up data
        let updates = effect.toObject();
        updates.name += " (" + type + ")";
        await effect.update(updates);
    }
}