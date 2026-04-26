// File: Tests/zoo_tests.swift

import XCTest

class ZooTests: XCTestCase {
    func testDogSpeaks() {
        let dog = Dog(name: "Rex")
        let sound = dog.speak()
        XCTAssertEqual(sound, "Av av!")
    }

    func testFeedAll() {
        let vet = Vet()
        let zoo = Zoo(vet: vet)
        let dog = Dog(name: "Rex")
        let cat = Cat(name: "Mica")
        zoo.addAnimal(dog)
        zoo.addAnimal(cat)
        zoo.feedAll()
    }

    func testPigRolls() {
        let pig = Pig(weight: 50.0)
        pig.roll()
    }
}
