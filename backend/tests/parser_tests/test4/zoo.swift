// File: zoo.swift
// Main orchestrator: public API, if/else, switch, guard branching

import Foundation

public class Zoo {
    private var animals: [Animal] = []
    private let vet: Vet

    public init(vet: Vet) {
        self.vet = vet
    }

    public func addAnimal(_ animal: Animal) {
        animals.append(animal)
    }

    public func feedAll() {
        for animal in animals {
            animal.eat()
        }
    }

    public func rollCall() {
        for animal in animals {
            let msg = animal.describe()
            Logger.log(msg)
        }
    }

    func checkHealth(animal: Animal, isUrgent: Bool) {
        if isUrgent {
            vet.emergency(animal)
        } else {
            vet.routine(animal)
        }
    }

    func handleCommand(_ command: String) {
        switch command {
        case "feed":
            feedAll()
        case "roll":
            rollCall()
        default:
            Logger.warn("Unknown command")
        }
    }

    func tryAdmit(name: String?) {
        guard let validName = name else {
            Logger.warn("No name given")
            return
        }
        let dog = Dog(name: validName)
        addAnimal(dog)
    }
}
