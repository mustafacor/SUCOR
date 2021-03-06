const con = require("./connection");
let userModel = {};


userModel.register = async (user) => {
    console.log("test");

    let checkMail = await userModel.checkMail(user.eposta),
        checkUsername = await userModel.checkUsername(user.kullaniciAdi);
    // Kayıtlı mı diye kontrol et 
    if (checkMail.length > 0 || checkUsername.length > 0) {
        return new Promise((resolve, reject) => {
            // Kayıtlı ise gerekli cevabı ver
            resolve({ register: false, err: "registered" })
        });
    }
    // Kayıtlı değil ise kaydet
    return new Promise((resolve, reject) => {
        let sql = `INSERT INTO kullanicilar(kullaniciAdi,adSoyad,sifre,eposta) VALUES ('${user.kullaniciAdi}','${user.adSoyad}','${user.sifre}','${user.eposta}')`;
        con.query(
            sql, (err, result) => {
                if (err) reject(err)
                resolve({ register: true });
            });
    });
}
// Verilen eposta adresi kayıtlı mı diye kontrol et
userModel.checkMail = (mail) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM kullanicilar WHERE eposta = "${mail}"`;
        con.query(
            sql, (err, result) => {
                if (err) reject(err)
                resolve(result);
            });
    });
}

// Verilen username adresi kayıtlı mı diye kontrol et
userModel.checkUsername = (username) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM kullanicilar WHERE kullaniciAdi = "${username}"`;
        con.query(
            sql, (err, result) => {
                if (err) reject(err)
                resolve(result);
            });
    });
}
userModel.checkUser = (userName, password) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM kullanicilar WHERE kullaniciAdi = "${userName}" AND sifre="${password}"`;
        con.query(
            sql, (err, result) => {
                if (err) reject(err)
                resolve(result);
            });
    });
}

userModel.getIdbyUserName = (userName) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT id FROM kullanicilar WHERE kullaniciAdi = "${userName}"`;
        con.query(
            sql, (err, result) => {
                if (err) reject(err);
                else if (result[0] != undefined) resolve(result[0].id);
            });
    });
}
userModel.getUserNamebyId = (id) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT kullaniciAdi FROM kullanicilar WHERE id = "${id}"`;
        con.query(
            sql, (err, result) => {
                if (err) reject(err)
                resolve(result[0].kullaniciAdi);
            });
    });
}
userModel.updatePP = (id, ppPath) => {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE kullanicilar SET profilResmi = "${ppPath}" WHERE id = ${id}`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(result);
        })
    });
}
userModel.updateCP = (id, cpPath) => {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE kullanicilar SET kapakResmi = "${cpPath}" WHERE id = ${id}`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(result);
        })
    });
}

userModel.getUserByUserName = function (username) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM kullanicilar WHERE kullaniciAdi = "${username}"`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(result);
        })
    })
}


function convertJS(requestData) {
    requestData = JSON.parse(requestData);
    requestData.gelen = JSON.parse(requestData.gelen);
    requestData.gonderilen = JSON.parse(requestData.gonderilen)
    return requestData;
}
function convertString(requestData) {
    let stringGelen = JSON.stringify(requestData.gelen);
    let stringGonderilen = JSON.stringify(requestData.gonderilen);
    let stringRequest = `{"gelen":"${stringGelen}","gonderilen":"${stringGonderilen}"}`;
    return stringRequest;
}

async function getAllFriendRequests(myId, sentId) {
    let myRequests = await (new Promise((resolve, reject) => {
        let sql = `SELECT istekler FROM kullanicilar WHERE id = ${myId}`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(result[0].istekler);
        })
    }));
    let itsRequests = await (new Promise((resolve, reject) => {
        let sql = `SELECT istekler FROM kullanicilar WHERE id = ${sentId}`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(result[0].istekler);
        })
    }));
    return { myRequests, itsRequests };
}

function updateRequest(request, id) {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE kullanicilar SET istekler=' ${convertString(request)} ' WHERE id = ${id}`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(result);
        })
    });
}

userModel.getFriends = function (id) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT arkadaslar FROM kullanicilar WHERE id = ${id}`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(JSON.parse(result[0].arkadaslar));
        })
    });
}

function updateFriends(id, arkadaslar) {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE kullanicilar SET arkadaslar = "${arkadaslar}" WHERE id = ${id}`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(result);
        })
    });
}
userModel.sendFriendRequest = async function (myId, sentId) {
    let { myRequests, itsRequests } = await getAllFriendRequests(myId, sentId);

    itsRequests = convertJS(itsRequests);
    myRequests = convertJS(myRequests);

    if (itsRequests.gelen.includes(myId) && myRequests.gonderilen.includes(sentId)) {
        return;
    }

    itsRequests.gelen.push(myId);
    myRequests.gonderilen.push(sentId);

    //Update myRequest in db
    updateRequest(myRequests, myId);
    //Update itsRequests in db
    updateRequest(itsRequests, sentId);
}


userModel.acceptFriendRequest = async function (myId, ItsId) {
    let { myRequests, itsRequests } = await getAllFriendRequests(myId, ItsId);
    itsRequests = convertJS(itsRequests);
    myRequests = convertJS(myRequests);

    let myFriends, itsFriends;
    myFriends = await this.getFriends(myId);
    itsFriends = await this.getFriends(ItsId);

    if (myRequests.gelen.includes(ItsId) && itsRequests.gonderilen.includes(myId)) {
        let ItsIdIndex = myRequests.gelen.indexOf(ItsId);
        let myIdIndex = itsRequests.gonderilen.indexOf(myId);
        myRequests.gelen.splice(ItsIdIndex, 1);
        itsRequests.gonderilen.splice(myIdIndex, 1);
        myFriends.push(ItsId);
        itsFriends.push(myId);
        updateFriends(myId, JSON.stringify(myFriends));
        updateFriends(ItsId, JSON.stringify(itsFriends));
        updateRequest(myRequests, myId);
        updateRequest(itsRequests, ItsId);
    }
}
userModel.rejectFriendRequest = async function (myId, ItsId) {
    let { myRequests, itsRequests } = await getAllFriendRequests(myId, ItsId);
    itsRequests = convertJS(itsRequests);
    myRequests = convertJS(myRequests);

    if (myRequests.gelen.includes(ItsId) && itsRequests.gonderilen.includes(myId)) {
        let ItsIdIndex = myRequests.gelen.indexOf(ItsId);
        let myIdIndex = itsRequests.gonderilen.indexOf(myId);
        myRequests.gelen.splice(ItsIdIndex, 1);
        itsRequests.gonderilen.splice(myIdIndex, 1);
        updateRequest(myRequests, myId);
        updateRequest(itsRequests, ItsId);
    }
}

userModel.cancelFriendRequest = async function (myId, ItsId) {
    let { myRequests, itsRequests } = await getAllFriendRequests(myId, ItsId);
    itsRequests = convertJS(itsRequests);
    myRequests = convertJS(myRequests);

    if (myRequests.gonderilen.includes(ItsId) && itsRequests.gelen.includes(myId)) {
        let ItsIdIndex = myRequests.gonderilen.indexOf(ItsId);
        let myIdIndex = itsRequests.gelen.indexOf(myId);
        myRequests.gonderilen.splice(ItsIdIndex, 1);
        itsRequests.gelen.splice(myIdIndex, 1);
        updateRequest(myRequests, myId);
        updateRequest(itsRequests, ItsId);
    }
}

userModel.deleteFriend = async function (myId, itsId) {
    let myFriends = await this.getFriends(myId);
    let itsFriends = await this.getFriends(itsId);
    let itsIdIndex = myFriends.indexOf(itsId);
    let myIdIndex = itsFriends.indexOf(myFriends);

    myFriends.splice(itsIdIndex, 1);
    itsFriends.splice(myIdIndex, 1);

    updateFriends(myId, JSON.stringify(myFriends));
    updateFriends(itsId, JSON.stringify(itsFriends));
}

userModel.getBlockedUsers = (id) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT bloklular FROM kullanicilar WHERE id = ${id}`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(JSON.parse(result[0].bloklular));
        });
    });
}

userModel.blockUser = async (myId, sentId) => {
    let myBlockeds = await userModel.getBlockedUsers(myId);
    myBlockeds.push(sentId);
    myBlockeds = JSON.stringify(myBlockeds);
    return updateBlockUser(myId, myBlockeds);
}

function updateBlockUser(myId, blocked) {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE kullanicilar SET bloklular = "${blocked}" WHERE id = ${myId}`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
}

userModel.calcelBlock = async (myId, itsId) => {
    let myBlockeds = await userModel.getBlockedUsers(myId);
    myBlockeds.splice((myBlockeds.indexOf(itsId)), 1);
    return updateBlockUser(myId, JSON.stringify(myBlockeds));
}

userModel.checkPassword = async (username, password) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT sifre FROM kullanicilar WHERE kullaniciAdi = "${username}"`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            if (result[0].sifre == password) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}
userModel.updatePassword = async (id, newpassword) => {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE kullanicilar SET sifre = '${newpassword}' WHERE id=${id}`
        con.query(sql, (err, result) => {
            if (err) reject(err);
            else {
                resolve({ status: 'ok' });
            }
        });
    });
}
userModel.updateUsernameAndName = async (id, newUsername, newName) => {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE kullanicilar SET kullaniciAdi = '${newUsername}', adSoyad= '${newName}' WHERE id=${id}`
        con.query(sql, (err, result) => {
            if (err) reject(err);
            else {
                resolve({ status: 'ok' });
            }
        });
    });
}
userModel.updateInfo = async (id, info) => {
    info = JSON.stringify(info);

    return new Promise((resolve, reject) => {
        let sql = `UPDATE kullanicilar SET kisiselBilgi = '${info}' WHERE id = ${id}`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            else {
                resolve("ok");
            }
        })
    });

}
userModel.search = async (keyword) => {
    let promise = new Promise((resolve, reject) => {
        let sql = `SELECT * FROM kullanicilar WHERE adSoyad LIKE '%${keyword}%'`;
        con.query(sql, (err, result) => {
            if (err) reject(err);
            else {
                resolve(result);
            }
        });
    });
    return promise;
}
module.exports = userModel;

