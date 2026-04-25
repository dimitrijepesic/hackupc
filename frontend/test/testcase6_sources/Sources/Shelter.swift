import Foundation

struct AdoptionError: Error {
    let message: String
}

class Shelter {

    func run() {
        self.processAll()
    }

    func adopt(_ animal: Animal) throws -> String {
        let sound = animal.speak()
        guard sound.count > 0 else {
            throw AdoptionError(message: "silent animal")
        }
        animal.eat("shelter food")
        self.log(sound)
        return sound
    }
    func processAll() {
        for animal in animals {
            try? self.adopt(animal)
        }
        self.processAll()
    }
    private func log(_ msg: String) {
        print(msg)
    }
}

func rescue(_ animal: Animal, at shelter: Shelter) throws {
    try shelter.adopt(animal)
    let _ = animal.speak()
    let _ = Dog()
    shelter.run()
}
